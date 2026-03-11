type TimeLog = {
    in: string;
    out: string
} | "dayoff" | null;

function isTimeDifferent(a: TimeLog, b: TimeLog): boolean {
    // both exactly the same (null or "dayoff")
    return !(a === b);

    // // one is null/dayoff, the other is not
    // if (!a || !b || a === "dayoff" || b === "dayoff") return true;

    // const sameHM = (d1: Date, d2: Date) =>
    //     d1.getHours() === d2.getHours() &&
    //     d1.getMinutes() === d2.getMinutes();

    // return (
    //     !sameHM(a.in, b.in) ||
    //     !sameHM(a.out, b.out)
    // );
}

export default isTimeDifferent;