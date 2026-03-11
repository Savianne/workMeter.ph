type AttendanceStatus = "on-time" | "late" | "absent";

export function getAttendanceStatus(
  scheduleTime: Date,
  timeIn: Date,
  lateThresholdMinutes: number,
  absentThresholdMinutes: number
): AttendanceStatus {

  const diffMs = timeIn.getTime() - scheduleTime.getTime();
  const diffMinutes = diffMs / (1000 * 60);

  // If absent threshold is enabled
  if (absentThresholdMinutes > 0 && diffMinutes > absentThresholdMinutes) {
    return "absent";
  }

  // Late condition
  if (diffMinutes > lateThresholdMinutes) {
    return "late";
  }

  return "on-time";
}