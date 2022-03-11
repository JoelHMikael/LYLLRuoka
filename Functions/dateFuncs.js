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

module.exports = {
    fromString: stringToDate,
    between: isBetweenDates,
    weekdayToNumber: weekdayToNumber
}