import type { Property, URI } from "./types";

const RATE_LIMIT = 5;
const SIZE_LIMIT = 100;

export interface Triple {
	subject: Node;
	property: Node;
	object: Node;
}

export interface Node {
	// termType: string;
	type: "literal" | "uri";
	value: string;
}
const endpoint = "https://dbpedia.org/sparql";
//const endpoint = "https://skynet.coypu.org/wikidata/";
//const endpoint = "https://query.wikidata.org/sparql";

async function SPARQL_query<T>(body: string) {
	var urlencoded = new URLSearchParams();
	urlencoded.append("query", body);

	const result = await fetch(endpoint, {
		method: "POST",

		headers: {
			"Content-Type": "application/x-www-form-urlencoded",
			Accept: "application/sparql-results+json"
		},

		body: urlencoded
	});
	/* const content = `?query=${encodeURIComponent(body)}`;
	const result = await fetch(endpoint + content, {
		method: "GET",
		headers: {
			Accept: "application/sparql-results+json",
		},
	}); */
	const json = await result.json();

	const triples: T[] = [];
	for (let binding of json.results.bindings) {
		triples.push(binding);
	}

	return triples;
}

export async function fetch_data(subject: URI, property: URI, nodes: URI[]) {
	const result = await SPARQL_query<Triple>(
		`PREFIX wikibase: <http://wikiba.se/ontology#>
		PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
		SELECT DISTINCT ?object  WHERE {
			{
			  ?object <${property}> <${subject}> .
			} UNION{
				<${subject}> <${property}> ?object
			}
			} LIMIT ${SIZE_LIMIT}`
	);

	const results: {
		uri: URI;
		label: string;
		relations: {
			subject: Node;
			property: Node;
			object: Node;
			propLabel: Node;
		}[];
	}[] = [];

	const all_new_nodes = result.map((c) => c.object.value);

	for (let i = 0; i < result.length; i += RATE_LIMIT) {
		const new_nodes = result
			.slice(i, i + RATE_LIMIT)
			.map((c) => c.object.value);

		const requests: { uri: URI; relations: any }[] = [];
		new_nodes.forEach((node) =>
			requests.push({
				uri: node,
				relations: fetch_relations(node, [...nodes, ...all_new_nodes])
			})
		);
		// results.push(...(await Promise.all(requests.map(r => [r.label, r.relations]))));
		for (let i = 0; i < requests.length; i++) {
			const request = requests[i];
			const r = await request.relations;
			results.push({ uri: request.uri, relations: r, label: "" });
		}
	}

	const labels = await fetch_labels(results.map((r) => r.uri));

	for (let node of results) {
		node.label = labels.find((l) => l.uri == node.uri)?.label ?? "";
	}

	return results;
}

export async function fetch_labels(subjects: URI[]) {
	const result = await SPARQL_query<{
		subject: { value: URI };
		subjectLabel: { value: string };
	}>(
		`
		PREFIX bd: <http://www.bigdata.com/rdf#>
		PREFIX wikibase: <http://wikiba.se/ontology#>
		PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
		SELECT DISTINCT ?subject ?subjectLabel  WHERE {
          VALUES ?subject {
    		${subjects.map((s) => `<${s}>`).join("\n")}
  			}

 		
			  ?subject rdfs:label ?subjectLabel 
			  FILTER (lang(?subjectLabel) = 'en')
		}
			`
	);
	if (result.length > 0) {
		return result.map((r) => {
			return { uri: r.subject.value, label: r.subjectLabel.value };
		});
	} else if (subjects.length == 1) {
		return [{ uri: subjects[0], label: subjects[0] }];
	}

	throw new Error("Unable to fetch label: " + result);
}

export async function fetch_label(subject: URI) {
	const result = await SPARQL_query<{ subjectLabel: { value: string } }>(
		`
		PREFIX bd: <http://www.bigdata.com/rdf#>
		PREFIX wikibase: <http://wikiba.se/ontology#>
		PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
		SELECT DISTINCT ?subjectLabel WHERE {
          VALUES ?subject {
    		<${subject}>
  			}

 		
		?subject rdfs:label ?subjectLabel 
		FILTER (lang(?subjectLabel) = 'en')
		
		}
			`
	);
	if (result.length > 0) {
		return result[0].subjectLabel.value;
	}

	return subject;
}

export async function fetch_relations(subject: URI, other_nodes: URI[]) {
	let relations = `VALUES ?object {\n`;

	for (let i = 0; i < other_nodes.length; i++) {
		const node = other_nodes[i];

		relations += `<${node}>\n`;
	}
	relations += "}";

	const result = await SPARQL_query(
		`
		PREFIX bd: <http://www.bigdata.com/rdf#>
		PREFIX wikibase: <http://wikiba.se/ontology#>
		PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
		SELECT DISTINCT ?object ?property ?propLabel ?subject WHERE
		{
			VALUES ?subject {
				<${subject}>
			}
			${relations}
			{	
				?object ?property ?subject .
			} UNION{
				?subject ?property ?object .
			}
			?claim wikibase:directClaim ?property.
			?prop wikibase:directClaim ?property .
			?prop rdfs:label ?propLabel 
			FILTER (lang(?propLabel) = 'en')
			
		}`
	);

	return result as {
		subject: Node;
		property: Node;
		object: Node;
		propLabel: Node;
	}[];
}

export async function fetch_property(
	subject: URI,
	property: URI
): Promise<Property> {
	const result = await SPARQL_query<{
		propLabel: { value: string };
		outCount: { value: number };
		inCount: { value: number };
	}>(
		`
		PREFIX wikibase: <http://wikiba.se/ontology#>
		PREFIX bd: <http://www.bigdata.com/rdf#>
		PREFIX wdt: <http://www.wikidata.org/prop/direct/>
		PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
		PREFIX wd: <http://www.wikidata.org/entity/>
		SELECT DISTINCT ?propLabel (COUNT(?outObject) AS ?outCount) (COUNT(?inObject) AS ?inCount)    WHERE {
		{
			SELECT DISTINCT ?outObject WHERE {
			<${subject}> <${property}> ?outObject.
			}
			LIMIT ${SIZE_LIMIT}
		}
		UNION
		{
			SELECT DISTINCT ?inObject WHERE {
			?inObject <${property}> <${subject}>.
			}
			LIMIT ${SIZE_LIMIT}
		}
		OPTIONAL {
			?prop wikibase:directClaim <${property}> .
			}
		?prop rdfs:label ?propLabel 
		FILTER (lang(?propLabel) = 'en')
		} GROUP BY ?propLabel `
	);

	if (result.length > 0) {
		const res = result[0];
		return {
			label: res.propLabel?.value,
			uri: property,
			out_count: +res.outCount.value,
			in_count: +res.inCount.value
		};
	}

	throw new Error("Unable to fetch Property: " + result);
}

export async function fetch_properties(
	subject: URI,
	progress_function?: Function
) {
	const result = await SPARQL_query<{ property: { value: string } }>(
		`
		PREFIX wikibase: <http://wikiba.se/ontology#>
		PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
		SELECT DISTINCT ?property  WHERE {
			{
			  ?o ?property <${subject}> .
			} UNION{
				<${subject}> ?property ?o
			}
			?claim wikibase:directClaim ?property.
			}`
	);

	const results: Property[] = [];
	for (let i = 0; i < result.length; i += RATE_LIMIT) {
		const properties = result
			.slice(i, i + RATE_LIMIT)
			.map((c) => c.property.value);

		const requests: Promise<Property>[] = [];
		properties.forEach((prop) => requests.push(fetch_property(subject, prop)));
		results.push(...((await Promise.all(requests)) as Property[]));
		if (progress_function)
			progress_function(Math.floor((i / result.length) * 100));
	}

	return results;
}

async function timeout(ms: number) {
	return new Promise((resolve) => {
		setTimeout(resolve, ms);
	});
}
