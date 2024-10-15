let utils = {
    numberRound(num, pointCount = 2) {
        let flag = parseFloat(`1` + (''.padStart(pointCount, '0')));
        return Math.round(num * flag) / flag;
    },
    beautifySize(value, numberRound=2) {
        let Units = ['B', 'KB', 'MB', 'GB', 'TB'];
        let each = 1024;
        let endValue = value;
        let unit = Units.shift();
        while (endValue > each || Units.length <= 0) {
            endValue = endValue / each;
            unit = Units.shift();
        }

        endValue = utils.numberRound(endValue, numberRound);

        return endValue + unit;
    },
    sleep(time) {
        return new Promise(resolve => setTimeout(resolve, time));
    },

    fixFileName(fileName) {
        if (typeof fileName === "undefined") return undefined;
        if (fileName.trim().length === 0) return fileName;

        return fileName.replace(/[\\/:*?"<>|]/g, function (matchStr) {
            return {
                "\\": "_",
                "/": "-",
                ":": ".",
                "*": "-",
                "\"": "'",
                "<": "[",
                ">": "]",
                "|": "!"
            }[matchStr] || "_";
        });
    }
};


module.exports = utils;
