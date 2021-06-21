export const dictToArray = (dictionary) => {
    var arr = [];

    for (var key in dictionary) {
        arr.push([key, dictionary[key]]);
    }

    return arr;
}
