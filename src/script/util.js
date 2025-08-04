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

    fixFileName(input) {
        const reservedNames = new Set([
            'CON', 'PRN', 'AUX', 'NUL',
            'COM1','COM2','COM3','COM4','COM5','COM6','COM7','COM8','COM9',
            'LPT1','LPT2','LPT3','LPT4','LPT5','LPT6','LPT7','LPT8','LPT9'
        ]);

        // 1. 过滤非法字符
        const cleaned = input.replace(/[^0-9a-zA-Z\u4e00-\u9fff\u3000-\u303F_\-.\[\]!]/gu, '');

        // 2. 移除开头和结尾的点（.）或空格
        let trimmed = cleaned.trim().replace(/^[.]+|[.]+$/g, '');

        // 3. 默认文件名（避免空）
        if (trimmed === '') trimmed = 'untitled';

        // 4. 避免保留字（如 CON），加前缀
        if (reservedNames.has(trimmed.toUpperCase())) {
            trimmed = '_' + trimmed;
        }

        return trimmed;
    }
};


module.exports = utils;
