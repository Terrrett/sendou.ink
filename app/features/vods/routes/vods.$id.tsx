import type { MetaFunction, SerializeFrom } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import clsx from "clsx";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { LinkButton } from "~/components/elements/Button";
import { FormWithConfirm } from "~/components/FormWithConfirm";
import { Image, WeaponImage } from "~/components/Image";
import { EditIcon } from "~/components/icons/Edit";
import { TrashIcon } from "~/components/icons/Trash";
import { Main } from "~/components/Main";
import { YouTubeEmbed } from "~/components/YouTubeEmbed";
import { useUser } from "~/features/auth/core/user";
import { useIsMounted } from "~/hooks/useIsMounted";
import { useSearchParamState } from "~/hooks/useSearchParamState";
import { databaseTimestampToDate } from "~/utils/dates";
import { metaTags } from "~/utils/remix";
import type { SendouRouteHandle } from "~/utils/remix.server";
import type { Unpacked } from "~/utils/types";
import {
	modeImageUrl,
	navIconUrl,
	newVodPage,
	stageImageUrl,
	VODS_PAGE,
	vodVideoPage,
} from "~/utils/urls";
import { SendouButton } from "../../../components/elements/Button";
import { action } from "../actions/vods.$id.server";
import { PovUser } from "../components/VodPov";
import { loader } from "../loaders/vods.$id.server";
import type { Vod } from "../vods-types";
import { canEditVideo, secondsToHoursMinutesSecondString } from "../vods-utils";
export { loader, action };

import "../vods.css";

export const handle: SendouRouteHandle = {
	breadcrumb: ({ match }) => {
		const data = match.data as SerializeFrom<typeof loader> | undefined;

		if (!data) return [];

		return [
			{
				imgPath: navIconUrl("vods"),
				href: VODS_PAGE,
				type: "IMAGE",
			},
			{
				text: data.vod.title,
				href: vodVideoPage(data.vod.id),
				type: "TEXT",
			},
		];
	},
};

export const meta: MetaFunction<typeof loader> = (args) => {
	if (!args.data) return [];

	return metaTags({
		title: args.data.vod.title,
		description:
			"Splatoon 3 VoD with timestamps to check out specific weapons as well as map and mode combinations.",
		location: args.location,
	});
};

export default function VodPage() {
	const [start, setStart] = useSearchParamState({
		name: "start",
		defaultValue: 0,
		revive: Number,
	});
	const { i18n } = useTranslation();
	const isMounted = useIsMounted();
	const [autoplay, setAutoplay] = React.useState(false);
	const data = useLoaderData<typeof loader>();
	const { t } = useTranslation(["common", "vods"]);
	const user = useUser();

	return (
		<Main className="stack lg">
			<div className="stack sm">
				<YouTubeEmbed
					key={start}
					id={data.vod.youtubeId}
					start={start}
					autoplay={autoplay}
				/>
				<h2 className="text-sm">{data.vod.title}</h2>
				<div className="stack horizontal justify-between">
					<div className="stack horizontal sm items-center">
						<PovUser pov={data.vod.pov} />
						<time
							className={clsx("text-lighter text-xs", {
								invisible: !isMounted,
							})}
						>
							{isMounted
								? databaseTimestampToDate(
										data.vod.youtubeDate,
									).toLocaleDateString(i18n.language, {
										day: "numeric",
										month: "numeric",
										year: "numeric",
									})
								: "t"}
						</time>
					</div>

					{canEditVideo({
						submitterUserId: data.vod.submitterUserId,
						userId: user?.id,
						povUserId:
							typeof data.vod.pov === "string" ? undefined : data.vod.pov?.id,
					}) ? (
						<div className="stack horizontal md">
							<LinkButton
								to={newVodPage(data.vod.id)}
								size="small"
								testId="edit-vod-button"
								icon={<EditIcon />}
							>
								{t("common:actions.edit")}
							</LinkButton>
							<FormWithConfirm
								dialogHeading={t("vods:deleteConfirm", {
									title: data.vod.title,
								})}
							>
								<SendouButton
									variant="minimal-destructive"
									size="small"
									type="submit"
									icon={<TrashIcon />}
								>
									{t("common:actions.delete")}
								</SendouButton>
							</FormWithConfirm>
						</div>
					) : null}
				</div>
			</div>
			<div className="vods__matches">
				{data.vod.matches.map((match) => (
					<Match
						key={match.id}
						match={match}
						setStart={(newStart) => {
							setStart(newStart);
							setAutoplay(true);
							window.scrollTo(0, 0);
						}}
					/>
				))}
			</div>
		</Main>
	);
}

function Match({
	match,
	setStart,
}: {
	match: Unpacked<Vod["matches"]>;
	setStart: (start: number) => void;
}) {
	const { t } = useTranslation(["game-misc", "weapons"]);

	const weapon = match.weapons.length === 1 ? match.weapons[0] : null;
	const weapons = match.weapons.length === 8 ? match.weapons : null;

	return (
		<div className="vods__match">
			<Image
				alt=""
				path={stageImageUrl(match.stageId)}
				width={120}
				className="rounded"
			/>
			{weapon ? (
				<WeaponImage
					weaponSplId={weapon}
					variant="badge"
					width={42}
					className="vods__match__weapon"
					testId={`weapon-img-${weapon}`}
				/>
			) : null}
			<Image
				path={modeImageUrl(match.mode)}
				width={32}
				className={clsx("vods__match__mode", { cast: Boolean(weapons) })}
				alt={t(`game-misc:MODE_LONG_${match.mode}`)}
				title={t(`game-misc:MODE_LONG_${match.mode}`)}
			/>
			{weapons ? (
				<div className="stack horizontal md">
					<div className="vods__match__weapons">
						{weapons.slice(0, 4).map((weapon, i) => {
							return (
								<WeaponImage
									key={i}
									testId={`weapon-img-${weapon}-${i}`}
									weaponSplId={weapon}
									variant="badge"
									width={30}
								/>
							);
						})}
					</div>
					<div className="vods__match__weapons">
						{weapons.slice(4).map((weapon, i) => {
							const adjustedI = i + 4;
							return (
								<WeaponImage
									key={i}
									testId={`weapon-img-${weapon}-${adjustedI}`}
									weaponSplId={weapon}
									variant="badge"
									width={30}
								/>
							);
						})}
					</div>
				</div>
			) : null}
			<SendouButton
				size="small"
				onPress={() => setStart(match.startsAt)}
				variant="outlined"
			>
				{secondsToHoursMinutesSecondString(match.startsAt)}
			</SendouButton>
		</div>
	);
}
