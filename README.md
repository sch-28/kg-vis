<div align="center">

# KG-Visualization

[Introduction](#introduction) • [Features](#features) • [Installation](#installation) • [Keybindings](#keybindings) 

![Status](https://img.shields.io/website?label=kg-vis&up_message=online&url=https%3A%2F%2Fsch-28.github.io%2Fkg-vis)
![Latest commit](https://img.shields.io/github/last-commit/sch-28/kg-vis)
![Build status: master](https://img.shields.io/github/actions/workflow/status/sch-28/kg-vis/deployment.yml)

<a href="https://sch-28.github.io/kg-vis"><img src="https://github.com/sch-28/kg-vis/blob/main/.github/images/banner.png" ></a>


</div>

## Introduction
This knowledge graph visualization tool aims to help you visualize and explore knowledge graphs directly in your browser. The goal is to provide an intuitive and user-friendly interface to explore knowledge graphs and discover relations.

[DEMO](https://sch-28.github.io/kg-vis)

## Features
Kg-vis offers several key features that make it a powerful and effective solution for exploring and visualizing knowledge graphs:
- **Intuitive interface:** The tool provides a user-friendly interface that makes it easy to interact with knowledge graphs and explore the relationships between entities. You can easily navigate through the graph and view details about specific nodes.
- **Smart search:** Quickly add new nodes using the search functionality to expand your graph.
- **Filtering:** Focus on the nodes you need, and display only relevant data.
- **SPARQL support:** Directly import data with a SPARQL query or export your built graph to SPARQL for further use.

## Installation

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

## Future Work

- [ ] **Multi-Select**: Selecting multiple nodes to manipulate them simultaneously. This could be achieved by implementing a click-and-drag select box or shift-clicking multiple nodes. Deleting multiple nodes or creating a single filter with multiple root nodes could be possible options for multiple nodes.
- [ ] **Graph Layouts**: Currently, the graph stabilizes after the **forceAtlas2Based** algorithm provided by **vis.js**. Additional optional layouts, including a quick menu for the layout selection, could be helpful when dealing with complicated graphs.
- [ ] **Semantic Zoom**: While the current zooming already hides edge and node labels at a specific zoom level, it could still be improved by merging clusters when zoomed out. This would improve the larger graphs' performance and add clarity.
- [ ] **Focus**: Currently, to focus on a specific node or nodes, a filter can be used to delete the other nodes. This could be expanded by creating "focus nodes". Users could select a node or multiple (Multi-Select) and choose to merge them into a single focus node. Double-clicking the focus node would switch the context to the merge nodes (or single node). The context switch could be implemented as a tab system. In this new context, a user can manipulate this graph without affecting the original one and freely swap between the two contexts. In the end, the user can merge the two contexts again to create one single graph.
- [ ] **Custom Nodes \& Edges**: Adding entities not available in the selected knowledge graph could be another future work item. A dialog that features option as: 'Label', a select with options like 'Literal' or 'URI', and additional parameters that depend on the selection, e.g., literal datatype or language. Additionally, custom edges could be created featuring individual labels and URIs. This could also extend as an edit function for the other regular nodes and edges.
- [ ] **Cross-Endpoints**: The tool already works with DBpedia and Wikidata. However, at the time, it is only possible to choose one knowledge graph at once. Building on top of the custom nodes \& edges, an option to choose the endpoint dynamically could be added.
- [ ] **Time Slider**: Adding a slider that dynamically filters nodes based on their creation or update date could be a valuable feature for further knowledge exploration.
- [ ] **Filtering**: As stated in "Multi-Select", the filter feature could be expanded by allowing multiple root nodes. Additionally, the filter could be expanded to include more options. For example, filtering by edge direction, edge type, or node type could be helpful options. Moving the filter to the left/right side of the screen could also be an option to improve the user experience.
- [ ] **Extend Sharability**: Expanding the current sharing feature by introducing URL parameters that take RDF Data. Since large graphs require an increasingly long URL, adding a backend + database to save graphs optionally is one option to fix that issue.
- [ ] **Endpoint Login**: Some endpoints require a login to access the knowledge graph. A dialog with username and password inputs could support those endpoints.
- [ ] **Mobile Support**: Most features are fully functional on mobile devices. However, it is impossible to open the context menu currently since it requires a right-click. Possible solutions could be other options to open the context menu or have the right-click trigger by holding.
- [ ] **Loader Improvements**: Since the entire graph logic is handled in the main thread, the UI is blocked during the loading process. This causes the loading progress bar to stutter. Moving the graph to a separate thread would solve that but could also increase loading time due to the added thread communication. Therefore, this is something that needs experimenting.
- [ ] **Path Finder**: Metaphacts has a feature that tries to find a path between two selected entities. However, this would require custom endpoint logic and requires further research.
- [ ] **SVG Export**: Right-clicking the canvas and clicking the export option in the context menu will open an export dialog. Currently, this allows a crude image and SPARQL export. For better label readability, an SVG option would be required. Vis.js does not support this at the current moment. A self-made solution would be needed.
Additionally, an issue with the tainted canvas error occurs when a user tries to export a graph with images.
- [ ] Combine edges with the same source and target and increase width. On hover, show all labels.
- [ ] More endpoint support.
- [ ] Indicator for locked nodes.
- [ ] Actual SPARQL parser in add-nodes.
- [ ] Scale nodes based on relevancy (e.g. number of edges).
- [ ] Query relevancy of nodes (popularity).
- [ ] Truncate long labels.
- [ ] Cancable loading screen.
- [ ] Sharing, e.g. with a new endpoint for direct import.
- [ ] Fix the tainted canvas error.
