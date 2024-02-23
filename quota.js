module.exports = function ( count, interval ) {
    var newQuota = {points: count, interval: interval, max: count, time: 0}
    newQuota.try = function (num) {
            if (Date.now() >= newQuota.time) {newQuota.time = Date.now() + newQuota.interval; newQuota.points = newQuota.max}
            if (newQuota.points > 0 + (!isNaN(num) ? (num - 1) : 0)) return true;
            return false;
    }

    newQuota.spend = function (num) {
            if (Date.now() >= newQuota.time) {newQuota.time = Date.now() + newQuota.interval; newQuota.points = newQuota.max}
            if (typeof num !== "number") return;
            newQuota.points -= Math.floor(num)
            if (newQuota.points < 0) newQuota.points = 0
    }
    return newQuota
}
