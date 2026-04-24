function getSemiMonthlyCutoffs(year: number, month: number) {
    const cutoffs = [];

    // month is 1-based (1 = January)
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);

    // 1st cutoff: 1 - 15
    const firstCutoffStart = new Date(year, month - 1, 1);
    const firstCutoffEnd = new Date(year, month - 1, 15);

    cutoffs.push({
        cutoffStart: `${firstCutoffStart.getFullYear()}-${firstCutoffStart.getMonth() + 1}-${firstCutoffStart.getDate()}`,
        cutoffEnd: `${firstCutoffEnd.getFullYear()}-${firstCutoffEnd.getMonth() + 1}-${firstCutoffEnd.getDate()}`
    });

    // 2nd cutoff: 16 - end of month
    const secondCutoffStart = new Date(year, month - 1, 16);
    const secondCutoffEnd = lastDay;

    cutoffs.push({
        cutoffStart: `${secondCutoffStart.getFullYear()}-${secondCutoffStart.getMonth() + 1}-${secondCutoffStart.getDate()}`,
        cutoffEnd: `${secondCutoffEnd.getFullYear()}-${secondCutoffEnd.getMonth() + 1}-${secondCutoffEnd.getDate()}`
    });

    return cutoffs;
}

export default getSemiMonthlyCutoffs;