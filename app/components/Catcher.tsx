import {
	isRouteErrorResponse,
	useRevalidator,
	useRouteError,
} from "@remix-run/react";
import * as React from "react";
import { useCopyToClipboard, useLocation } from "react-use";
import { useUser } from "~/features/auth/core/user";
import {
	ERROR_GIRL_IMAGE_PATH,
	LOG_IN_URL,
	SENDOU_INK_DISCORD_URL,
} from "~/utils/urls";
import { SendouButton } from "./elements/Button";
import { Image } from "./Image";
import { Main } from "./Main";

export function Catcher() {
	const error = useRouteError();
	const user = useUser();
	const { revalidate } = useRevalidator();
	const location = useLocation();
	const [, copyToClipboard] = useCopyToClipboard();

	// refresh user data to make sure it's up to date (e.g. cookie might have been removed, let's show the prompt to log back in)
	React.useEffect(() => {
		if (!isRouteErrorResponse(error) || error.status !== 401) return;

		revalidate();
	}, [revalidate, error]);

	if (!isRouteErrorResponse(error)) {
		const errorText = (() => {
			if (!(error instanceof Error)) return;

			return `Time: ${new Date().toISOString()}\nURL: ${location.href}\nUser ID: ${user?.id ?? "Not logged in"}\n${error.stack ?? error.message}`;
		})();

		return (
			<Main>
				<Image
					className="m-0-auto"
					path={ERROR_GIRL_IMAGE_PATH}
					width={292}
					height={243.5}
					alt=""
				/>
				<h2 className="text-center">Error happened</h2>
				<p className="text-center">
					It seems like you encountered a bug. Sorry about that! Please share
					the diagnostics message below as well as other details (your browser?
					what were you doing?) on{" "}
					<a href={SENDOU_INK_DISCORD_URL}>our Discord</a> so it can be fixed.
				</p>
				{errorText ? (
					<div className="mt-4 stack sm items-center">
						<textarea readOnly defaultValue={errorText} />
						<SendouButton onPress={() => copyToClipboard(errorText)}>
							Copy to clipboard
						</SendouButton>
					</div>
				) : null}
			</Main>
		);
	}

	switch (error.status) {
		case 401:
			if (!user) {
				return (
					<Main>
						<h2>Authentication required</h2>
						<p>This page requires you to be logged in.</p>
						<form action={LOG_IN_URL} method="post" className="mt-2">
							<SendouButton type="submit" variant="minimal">
								Log in via Discord
							</SendouButton>
						</form>
					</Main>
				);
			}
			return (
				<Main>
					<h2>Error 401 Unauthorized</h2>
					<GetHelp />
				</Main>
			);
		case 403:
			return (
				<Main>
					<h2>Error 403 Forbidden</h2>
					<p className="text-sm text-lighter font-semi-bold">
						Your account doesn't have the required permissions to perform this
						action.
					</p>
					<GetHelp />
				</Main>
			);
		case 404:
			return (
				<Main>
					<h2>Error {error.status} - Page not found</h2>
					<GetHelp />
				</Main>
			);
		default:
			return (
				<Main>
					<h2>Error {error.status}</h2>
					<GetHelp />
					<div className="text-sm text-lighter font-semi-bold">
						Please include the message below if any and an explanation on what
						you were doing:
					</div>
					{error.data ? (
						<pre>{JSON.stringify(JSON.parse(error.data), null, 2)}</pre>
					) : null}
				</Main>
			);
	}
}

function GetHelp() {
	return (
		<p className="mt-2">
			If you need assistance you can ask for help on{" "}
			<a href={SENDOU_INK_DISCORD_URL}>our Discord</a>
		</p>
	);
}
