import type { EmployeeWeekday } from "@/database/employee/employee.type";

export const koreaTimeZone = "Asia/Seoul";
const koreaUtcOffsetMilliseconds = 9 * 60 * 60 * 1000;

export type CalendarMonth = {
	month: number;
	year: number;
};

export type CalendarMonthPeriod = CalendarMonth & {
	periodIndex: number;
};

export type CalendarDay = {
	dateKey: string;
	day: number;
	inCurrentMonth: boolean;
	weekday: EmployeeWeekday;
};



const weekdayByUtcDay: EmployeeWeekday[] = ["일", "월", "화", "수", "목", "금", "토"];



const koreaDateFormatter = new Intl.DateTimeFormat("en-CA", {
	timeZone: koreaTimeZone,
	year: "numeric",
	month: "2-digit",
	day: "2-digit",
});



function getDatePart(parts: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes) {
	return parts.find(part => part.type === type)?.value ?? "";
}



export function formatDateKey(year: number, month: number, day: number) {
	return `${year.toString().padStart(4, "0")}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
}



export function getKoreaTodayKey(now: Date = new Date()) {
	const parts = koreaDateFormatter.formatToParts(now);
	return `${getDatePart(parts, "year")}-${getDatePart(parts, "month")}-${getDatePart(parts, "day")}`;
}



export function getMillisecondsUntilNextKoreaDay(now: Date = new Date()) {
	const koreaTimestamp = now.getTime() + koreaUtcOffsetMilliseconds;
	const koreaDate = new Date(koreaTimestamp);
	const nextMidnight = Date.UTC(
		koreaDate.getUTCFullYear(),
		koreaDate.getUTCMonth(),
		koreaDate.getUTCDate() + 1,
	);

	return nextMidnight - koreaTimestamp;
}



export function parseDateKey(dateKey: string) {
	const [year, month, day] = dateKey.split("-").map(Number);
	return { day, month, year };
}



export function getCalendarMonth(dateKey: string): CalendarMonth {
	const { month, year } = parseDateKey(dateKey);
	return { month, year };
}



export function formatCalendarMonthKey({ month, year }: CalendarMonth) {
	return `${year.toString().padStart(4, "0")}-${month.toString().padStart(2, "0")}`;
}



export function parseCalendarMonthKey(monthKey: string): CalendarMonth | null {
	const match = /^(\d{4})-(\d{2})$/.exec(monthKey);

	if (!match) {
		return null;
	}

	const year = Number(match[1]);
	const month = Number(match[2]);

	if (!Number.isInteger(year) || month < 1 || month > 12) {
		return null;
	}

	return { month, year };
}



export function addCalendarMonths({ month, year }: CalendarMonth, amount: number): CalendarMonth {
	const date = new Date(Date.UTC(year, month - 1 + amount, 1));
	return {
		year: date.getUTCFullYear(),
		month: date.getUTCMonth() + 1,
	};
}



export function getCalendarMonthLastDateKey({ month, year }: CalendarMonth) {
	return formatDateKey(year, month, new Date(Date.UTC(year, month, 0)).getUTCDate());
}



export function getWeekday(dateKey: string): EmployeeWeekday {
	const { day, month, year } = parseDateKey(dateKey);
	return weekdayByUtcDay[new Date(Date.UTC(year, month - 1, day)).getUTCDay()];
}



export function buildCalendarMonthDays({ month, year }: CalendarMonth): CalendarDay[] {
	const firstDate = new Date(Date.UTC(year, month - 1, 1));
	const sundayOffset = firstDate.getUTCDay();
	const startDate = new Date(Date.UTC(year, month - 1, 1 - sundayOffset));

	return Array.from({ length: 42 }, (_, index) => {
		const date = new Date(startDate);
		date.setUTCDate(startDate.getUTCDate() + index);
		const dateYear = date.getUTCFullYear();
		const dateMonth = date.getUTCMonth() + 1;
		const day = date.getUTCDate();
		const dateKey = formatDateKey(dateYear, dateMonth, day);

		return {
			dateKey,
			day,
			inCurrentMonth: dateYear === year && dateMonth === month,
			weekday: weekdayByUtcDay[date.getUTCDay()],
		};
	});
}



export function formatCalendarMonthTitle({ month, year }: CalendarMonth) {
	return `${year}년 ${month}월`;
}



export function getCalendarMonthPeriodCount({ month, year }: CalendarMonth) {
	const firstWeekday = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
	const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
	const calendarRowCount = Math.ceil((firstWeekday + daysInMonth) / 7);

	return Math.ceil(calendarRowCount / 2);
}



export function getCalendarMonthPeriod(dateKey: string): CalendarMonthPeriod {
	const calendarMonth = getCalendarMonth(dateKey);
	const dateIndex = buildCalendarMonthDays(calendarMonth).findIndex(day => day.dateKey === dateKey);

	return {
		...calendarMonth,
		periodIndex: Math.max(0, Math.floor(dateIndex / 14)),
	};
}



export function buildCalendarMonthPeriodDays({
	month,
	periodIndex,
	year,
}: CalendarMonthPeriod) {
	const periodCount = getCalendarMonthPeriodCount({ month, year });
	const safePeriodIndex = Math.min(Math.max(periodIndex, 0), periodCount - 1);
	const startIndex = safePeriodIndex * 14;

	return buildCalendarMonthDays({ month, year }).slice(startIndex, startIndex + 14);
}



export function formatKoreaDateLabel(dateKey: string) {
	const { day, month, year } = parseDateKey(dateKey);
	return `${year}년 ${month}월 ${day}일 (${getWeekday(dateKey)})`;
}



export function formatShortDateLabel(dateKey: string) {
	const { day, month } = parseDateKey(dateKey);
	return `${month}/${day}`;
}



export function formatKoreaDateTime(isoDate: string) {
	return new Intl.DateTimeFormat("ko-KR", {
		timeZone: koreaTimeZone,
		month: "long",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
		hour12: false,
	}).format(new Date(isoDate));
}



export function timeToMinutes(time: string) {
	const [hour, minute] = time.split(":").map(Number);
	return hour * 60 + minute;
}



export function getTimeDurationMinutes(start: string, end: string) {
	const startMinutes = timeToMinutes(start);
	const rawEndMinutes = timeToMinutes(end);
	const endMinutes = rawEndMinutes < startMinutes ? rawEndMinutes + 24 * 60 : rawEndMinutes;
	return Math.max(0, endMinutes - startMinutes);
}



export function parseWorkTime(workTime: string) {
	const match = workTime.match(/^(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})$/);

	if (!match) {
		return null;
	}

	return {
		start: match[1],
		end: match[2],
	};
}
