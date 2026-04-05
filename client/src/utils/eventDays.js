export const EVENT_DAYS = [
  {
    value: 1,
    key: "tag1",
    label: "Tag 1",
    fullLabel: "Tag 1 - Freitag",
    dayLabel: "Freitag",
    shortLabel: "Freitag",
    timeLabel: "13:00 - 16:00",
  },
  {
    value: 2,
    key: "tag2",
    label: "Tag 2",
    fullLabel: "Tag 2 - Samstag",
    dayLabel: "Samstag",
    shortLabel: "Samstag",
    timeLabel: "09:00 - 13:00",
  },
];

export const getEventDayConfig = (eventDay) =>
  EVENT_DAYS.find((day) => day.value === Number(eventDay)) || EVENT_DAYS[0];

export const getTaskDateForDay = (task, eventDay) => {
  if (!task) return null;

  if (Number(eventDay) === 2) {
    return task.tag2_datum || task.tag1_datum || task.datum || null;
  }

  return task.tag1_datum || task.datum || null;
};

export const getTaskTimeForDay = (task, eventDay) => {
  if (!task) return null;

  if (Number(eventDay) === 2) {
    return task.tag2_uhrzeit || task.tag1_uhrzeit || task.uhrzeit || null;
  }

  return task.tag1_uhrzeit || task.uhrzeit || null;
};

export const getTeacherLabel = (task) => {
  if (Array.isArray(task?.lehrer_namen) && task.lehrer_namen.length > 0) {
    return task.lehrer_namen.join(", ");
  }

  return task?.lehrer_name || "";
};
