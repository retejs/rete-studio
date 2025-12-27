Rete Studio
====
[![Made in Ukraine](https://img.shields.io/badge/made_in-ukraine-ffd700.svg?labelColor=0057b7)](https://stand-with-ukraine.pp.ua)
[![Discord](https://img.shields.io/discord/1081223198055604244?color=%237289da&label=Discord)](https://discord.gg/cxSFkPZdsV)

**Rete.js application**

## Introduction

Rete Studio is a general-purpose code generation tool powered by Rete.js. Its primary goal is to seamlessly bridge the gap between textual and visual programming languages. With Rete Studio, you can transform a textual programming language into a visual representation, which can then be transformed back into textual language.

![codegen](https://raw.githubusercontent.com/retejs/rete-studio/main/assets/codegen.png)

## Key features

- **Core**: basic interfaces and methods for graph transformation
- **Languages**: transformation of specific programming languages into graphs and vice versa
- **UI**: components for visualizing the node editor and code editor
- **Demo**: application featuring Playground (shown on the screenshot)

## Roadmap

Currently, JavaScript is the only supported language. Considering the complexity of the transformation process, our current priority is building [a robust application](https://studio.retejs.org/). Once we have fine-tuned our methodologies and algorithms (including different programming languages), we will introduce them as a published plugin for Rete.js.

## Getting started

**Requirements**: Node.js version 20 or older.

Before launching the application, make sure to run the following command to install dependencies and build packages

```bash
bash ./setup.sh
```

Afterward, you can proceed to the `./demo` directory and launch the application

```bash
cd ./demo
npm run dev
```

## Development

For development purposes, if you intend to make modifications to packages `core`, `ui`, or any within the `languages` folder, you can run the following command

```bash
npx rete-kit build -f core,ui,languages/template,languages/javascript,demo
```

it will continuously build and synchronize dependencies.
Don't forget to restart your application with [clearing the cache](https://vitejs.dev/guide/dep-pre-bundling.html#file-system-cache)

```bash
 npm run dev -- --force
```

## Contribution

Please refer to the [Contribution](https://retejs.org/docs/contribution) guide

## License

[CC BY-NC-SA 4.0](https://github.com/retejs/rete-studio/blob/main/LICENSE)
