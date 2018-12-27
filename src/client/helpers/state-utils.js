
export function mutate(element, change) {
    return Object.assign({}, element, change);
}

export function changeElement(component, property, index, field, value) {
    component.setState(ps => ({
        [property]: ps[property].map((element, i) => (i === index ? mutate(element,{[field]:value}): element))
    }));
}

export function deleteElement(component, property, index, callback) {
    component.setState(ps => {
        let deleted = [...ps[property]];
        deleted.splice(index,1);
        return {[property]:deleted};
    }, callback);
}

export function addElement(component, property, element) {
    component.setState(ps => ({
        [property]: [...ps[property], element]
    }));
}