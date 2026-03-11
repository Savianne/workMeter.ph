export function get5MinsExpirationDate(): Date {
    const currentDate = new Date();
    const expirationDate = new Date(currentDate.getTime() + 5 * 60 * 1000); // Add 5 minutes in milliseconds

    return expirationDate;
}