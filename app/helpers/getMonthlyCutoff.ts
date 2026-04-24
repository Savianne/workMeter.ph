function getMonthlyCutoff(year: number, month: number) {
    const cutoffs = [];

    // month is 1-based (1 = January)
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);

    const monthStart = new Date(firstDay);
    const monthEnd = new Date(lastDay);

    cutoffs.push({
        cutoffStart: `${monthStart.getFullYear()}-${monthStart.getMonth() + 1}-${monthStart.getDate()}`,
        cutoffEnd: `${monthEnd.getFullYear()}-${monthEnd.getMonth() + 1}-${monthEnd.getDate()}`
    });

    return cutoffs;
}

export default getMonthlyCutoff;