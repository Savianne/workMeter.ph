
function getCalendarWeeklyCutoffs(year:number, month:number) {
    const weeks = [];

     // month is 1-based (1 = January)
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);

    // find Monday of the week where the 1st belongs
    const day = firstDay.getDay();
    const diffToMonday = (day === 0 ? -6 : 1 - day);

    let currentMonday = new Date(firstDay);
    currentMonday.setDate(firstDay.getDate() + diffToMonday);

    while (currentMonday <= lastDay) {
        const weekStart = new Date(currentMonday);

        const weekEnd = new Date(currentMonday);
        weekEnd.setDate(weekStart.getDate() + 6);

        weeks.push({
            weekStart: `${weekStart.getFullYear()}-${weekStart.getMonth() + 1}-${weekStart.getDate()}`,
            weekEnd: `${weekEnd.getFullYear()}-${weekEnd.getMonth() + 1}-${weekEnd.getDate()}`
        });

        // move to next week
        currentMonday.setDate(currentMonday.getDate() + 7);
    }

    return weeks;
}

export default getCalendarWeeklyCutoffs;