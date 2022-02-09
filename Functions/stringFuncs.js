function replaceElement(source, element, value) {
    const firstTag = `<${element}>`;

    const firstSpace = element.indexOf(" ");
    if (firstSpace !== -1)
        element = element.substring(0, firstSpace);
    const startTag = `<${element}.*?>`;
    const endTag = `</${element}.*?>`;

    const span = getTagSpan(source, [startTag, endTag], firstTag);

    return source.substring(0, span[0]) +
        value +
        source.substring(span[1]);
}

function getTagSpan(s, tags=["\\(", "\\)"], customFirstTag=undefined)
{
    customFirstTag = new RegExp(customFirstTag || tags[0]);
    let i = s.search(customFirstTag);
    if (i === -1)
        return s;
    
    tags = [
        new RegExp("^" + tags[0]),
        new RegExp("^" + tags[1])
    ];

    const start = i;
    i++;
    let depth = 1;
    while((depth !== 0) && (i !== s.length))
    {
        let maybeStartTag = s.substring(i);
        let maybeEndTag = s.substring(i);
        
        depth += +tags[0].test(maybeStartTag) + -tags[1].test(maybeEndTag);

        i++;
    }
     
    i += (s.substring(i - 1).match(tags[1]) || [""])[0] .length - 1;
    return [start, i];
}

const countOccurrences = (s, regex) => (s.match(regex) || []).length;
module.exports = {
    span: getTagSpan,
    replaceElement: replaceElement,
    count: countOccurrences
}