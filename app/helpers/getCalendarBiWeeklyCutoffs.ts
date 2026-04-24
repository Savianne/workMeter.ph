function getBiWeeklyCutoffs(year: number, month: number) {
    const cutoffs = [];

    // month is 1-based (1 = January)
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);

    // find Monday of the week where the 1st belongs (same logic as your weekly)
    const day = firstDay.getDay();
    const diffToMonday = (day === 0 ? -6 : 1 - day);

    let currentStart = new Date(firstDay);
    currentStart.setDate(firstDay.getDate() + diffToMonday);

    while (currentStart <= lastDay) {
        const cutoffStart = new Date(currentStart);

        const cutoffEnd = new Date(currentStart);
        cutoffEnd.setDate(cutoffStart.getDate() + 13); // 14 days total

        cutoffs.push({
            cutoffStart: `${cutoffStart.getFullYear()}-${cutoffStart.getMonth() + 1}-${cutoffStart.getDate()}`,
            cutoffEnd: `${cutoffEnd.getFullYear()}-${cutoffEnd.getMonth() + 1}-${cutoffEnd.getDate()}`
        });

        // move to next bi-weekly cycle (14 days)
        currentStart.setDate(currentStart.getDate() + 14);
    }

    return cutoffs;
}

export default getBiWeeklyCutoffs;