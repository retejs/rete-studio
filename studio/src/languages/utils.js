function flatExamples(examples, path = '') {
  return examples.reduce((examples, example) => {
    if ('children' in example) return [...examples, ...flatExamples(example.children, [path, example.name].join('/'))]

    return [...examples, example]
  }, [])
}

module.exports = {
  flatExamples
}
