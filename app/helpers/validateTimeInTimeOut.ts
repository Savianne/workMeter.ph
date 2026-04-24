const validateTimeInTimeOut = (dateTimeIn: Date, dateTimeOut: Date): Promise<{error?: string, result: {time_in: Date, time_out: Date}}> => {
    const dateString = `${dateTimeIn.getFullYear()}-${dateTimeIn.getMonth() + 1}-${dateTimeIn.getDate()}`
    dateTimeIn = new Date(`${dateString} ${dateTimeIn.toLocaleTimeString()}`);
    dateTimeOut = new Date(`${dateString} ${dateTimeOut.toLocaleTimeString()}`);

    return(
        new Promise((resolve, reject) => {
            const dateTimeInHour = dateTimeIn.getHours();
            const dateTimeOutHour = dateTimeOut.getHours();

            if(dateTimeInHour >= 12 && dateTimeInHour <= 23 && dateTimeOutHour >= 0 && dateTimeOutHour <= 11) {
                const hour = dateTimeOutHour + 24;
                dateTimeOut.setHours(hour);
            }

            if(dateTimeOut.getTime() < dateTimeIn.getTime()) {
               reject({error: "Time-out cannot be earlier than time-in."})
            }

            const diff = dateTimeOut.getTime() - dateTimeIn.getTime();

            const thirtyMinutes = 60 * 60 * 1000;

            if (!(diff >= thirtyMinutes)) {
                reject({error: "Time-out must be at least 1 hour after time-in."})
            }

            resolve({
                result: { time_in: dateTimeIn, time_out: dateTimeOut}
            })
        })
    )
}

export default validateTimeInTimeOut;