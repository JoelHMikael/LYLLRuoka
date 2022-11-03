// s: DD-MM-YYYY, return: Date
function stringToDate(s) {
    const date = s.split("-");
    return new Date(`${date[2].padStart(4, "0")}-${date[1].padStart(2, "0")}-${date[0].padStart(2, "0")}`);
}

const isBetweenDates = (date, date1, date2) => {
    date = approxDate(date);
    date1 = approxDate(date1);
    date2 = approxDate(date2);
    return ((date.getTime() >= date1.getTime())
    && (date.getTime() <= date2.getTime()));
};

function approxDate(d)
{
    return new Date(`${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}-${d.getDate().toString().padStart(2, "0")}`);
}

function weekdayToNumber(s)
{
	const weekdays = [
		/ma.*/i,
		/ti.*/i,
		/ke.*/i,
		/to.*/i,
		/pe.*/i,
		/la.*/i,
		/su.*/i
	];
	for(let day = 0; day < weekdays.length; day++)
	{
		if (s.match(weekdays[day]))
			return day;
	}
}


function run_at_monday_mornings(func) {
	const ms_in_h = 60/*min*/ * 60/*s*/ * 1000/*ms*/;

	const d = new Date();
	const hour = d.getHours(); // eg. fri 17:20 -> 17
	const weekday = d.getDay() || 7; // 1 = monday, 7 = sunday

	days_to_elapse = 8 - weekday;
	ms_to_elapse = ms_in_h * (
		days_to_elapse * 24/*hours in a day*/
		- hour // removes unneccessary hours so that we update it at 0 am
	) + 1 /*+1 so that we know that it won't be exactly midnight
	and possibly sunday. idk if this actually is needed.*/;

	setTimeout(() => run_at_monday_mornings(func), ms_to_elapse);

	if (weekday === 1)
		func();
}

module.exports = {
    fromString: stringToDate,
    between: isBetweenDates,
    weekdayToNumber: weekdayToNumber,
    run_at_monday_mornings: run_at_monday_mornings
}
