function computeTotalHours(timeIn: string | Date, timeOut: string | Date): number {
    const dateTimeIn = new Date(`1998-08-03 ${timeIn}`);
    const dateTimeOut = new Date(`1998-08-03 ${timeOut}`);

    const dateTimeInHour = dateTimeIn.getHours();
    const dateTimeOutHour = dateTimeOut.getHours();

    if(dateTimeInHour >= 12 && dateTimeInHour <= 23 && dateTimeOutHour >= 0 && dateTimeOutHour <= 11) {
        const hour = dateTimeOutHour + 24;
        dateTimeOut.setHours(hour);
    }

    const start = dateTimeIn.getTime();
    const end = dateTimeOut.getTime();

    const diffMs = end - start;
    const diffHours = diffMs / (1000 * 60 * 60);

    return Number(diffHours.toFixed(2)); // 2 decimal places
}

export default computeTotalHours;