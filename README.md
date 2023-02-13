# Knowledge Graph Visualization

This knowledge graph visualization tool aims to help you visualize and explore knowledge graphs directly in your browser. The goal is to provide an intuitive and user-friendly interface to explore knowledge graphs and discover relations.

[DEMO](https://sch-28.github.io/kg-vis)

## Features
Kg-vis offers several key features that make it a powerful and effective solution for exploring and visualizing knowledge graphs:
- **Intuitive interface:** The tool provides a user-friendly interface that makes it easy to interact with knowledge graphs and explore the relationships between entities. You can easily navigate through the graph and view details about specific nodes.
- **Smart search:** Quickly add new nodes using the search functionality to expand your graph.
- **Filtering:** Focus on the nodes you need, and display only relevant data.
- **SPARQL support:** Directly import data with a SPARQL query or export your built graph to SPARQL for further use.

## Installing

Install the dependencies with `npm install` and start a development server:

```bash
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version:

```bash
npm run build
```

You can preview the production build with `npm run preview`.

## Keybindings

| Key        | Action                |
|------------|-----------------------|
| CTRL+F     | Search/toggle filters |
| Delete     | Remove a node         |
| CTRL+ALT+N | Open "Add-Node"       |
| ALT+S      | Open "Settings"       |
| CTRL+S     | Open "Export"         |
| SHIFT+S    | Stabilize graph       |
| SHIFT+F    | Add filter            |
| CTRL+I     | Open "Information"    |
| CTRL+Z/Y   | Undo/Redo             |
