export const getTimeLabel = (date: Date) => {
    let hour = date.getHours().toString();
    let minute = date.getMinutes().toString();
    let second = date.getSeconds().toString();
    hour = hour.length === 1 ? "0" + hour : hour;
    minute = minute.length === 1 ? "0" + minute : minute;
    second = second.length === 1 ? "0" + second : second;
    return `${hour}:${minute}:${second}.${date.getMilliseconds()}`;
};

export default getTimeLabel;
