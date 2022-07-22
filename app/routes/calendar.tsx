import type { LoaderArgs } from "@remix-run/node";
import { json, type LinksFunction } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import type { UseDataFunctionReturn } from "@remix-run/react/dist/components";
import { addDays, subDays } from "date-fns";
import { Flipped, Flipper } from "react-flip-toolkit";
import { z } from "zod";
import { Main } from "~/components/Main";
import { db } from "~/db";
import styles from "~/styles/calendar.css";
import {
  databaseTimestampToDate,
  dateToWeekNumber,
  weekNumberToDate,
} from "~/utils/dates";
import type { Unpacked } from "~/utils/types";
import { actualNumber } from "~/utils/zod";

export const links: LinksFunction = () => {
  return [{ rel: "stylesheet", href: styles }];
};

const loaderSearchParamsSchema = z.object({
  week: z.preprocess(actualNumber, z.number().int().min(1).max(53)),
  year: z.preprocess(
    actualNumber,
    z.number().int().min(2022).max(new Date().getFullYear())
  ),
});

export const loader = ({ request }: LoaderArgs) => {
  const url = new URL(request.url);
  const parsedParams = loaderSearchParamsSchema.safeParse({
    year: url.searchParams.get("year"),
    week: url.searchParams.get("week"),
  });

  const now = new Date();
  const thisWeek = dateToWeekNumber(now);

  const weekToFetch = parsedParams.success ? parsedParams.data.week : thisWeek;
  const yearToFetch = parsedParams.success
    ? parsedParams.data.year
    : now.getFullYear();

  return json({
    thisWeek,
    weeks: closeByWeeks({ week: weekToFetch, year: yearToFetch }).map(
      (week) => ({
        ...week,
        numberOfEvents: 12,
      })
    ),
    events: fetchEventsOfWeek({ week: weekToFetch, year: yearToFetch }),
  });
};

function closeByWeeks(args: { week: number; year: number }) {
  const dateFromWeekNumber = weekNumberToDate(args);

  return [-4, -3, -2, -1, 0, 1, 2, 3, 4].map((week) => {
    const date =
      week < 0
        ? subDays(dateFromWeekNumber, Math.abs(week) * 7)
        : addDays(dateFromWeekNumber, week * 7);

    return {
      number: dateToWeekNumber(date),
      year: date.getFullYear(),
    };
  });
}

function fetchEventsOfWeek(args: { week: number; year: number }) {
  const startTime = weekNumberToDate(args);

  const endTime = new Date(startTime);
  endTime.setDate(endTime.getDate() + 7);
  // so we get all events of sunday even from US west coast perspective
  endTime.setHours(endTime.getHours() + 12);

  return db.calendar.findAllBetweenTwoTimestamps({ startTime, endTime });
}

export default function CalendarPage() {
  const data = useLoaderData<typeof loader>();

  return (
    <Main>
      <WeekLinks />
      {data.events.map((event) => {
        return <Event key={event.id} event={event} />;
      })}
    </Main>
  );
}

function WeekLinks() {
  const data = useLoaderData<typeof loader>();

  return (
    <Flipper flipKey={data.weeks.map(({ number }) => number).join("")}>
      <div className="flex justify-center">
        <div className="calendar__weeks">
          {data.weeks.map((week, i) => {
            const hidden = [
              0,
              1,
              data.weeks.length - 2,
              data.weeks.length - 1,
            ].includes(i);

            return (
              <Flipped key={week.number} flipId={week.number}>
                <Link
                  to={`?week=${week.number}&year=${week.year}`}
                  className="calendar__week"
                  aria-hidden={hidden}
                  tabIndex={hidden ? -1 : 0}
                >
                  <>
                    <div>
                      {week.number === data.thisWeek
                        ? "This"
                        : week.number - data.thisWeek === 1
                        ? "Next"
                        : week.number - data.thisWeek === -1
                        ? "Last"
                        : week.number}{" "}
                      <br />
                      Week
                    </div>
                    <div className="calendar__event-count">
                      ×{week.numberOfEvents}
                    </div>
                  </>
                </Link>
              </Flipped>
            );
          })}
        </div>
      </div>
    </Flipper>
  );
}

function Event({
  event,
}: {
  event: Unpacked<UseDataFunctionReturn<typeof loader>["events"]>;
}) {
  return (
    <section className="calendar__event">
      <time>
        {databaseTimestampToDate(event.startTime).toLocaleTimeString("en", {
          hour: "numeric",
          minute: "numeric",
        })}
      </time>{" "}
      {event.name}
    </section>
  );
}
