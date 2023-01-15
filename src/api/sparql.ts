import isUrl from 'is-url';
import { Settings } from '../settings';
import { get } from 'svelte/store';
import type { Property, URI } from './graph';
export interface Triple extends Binding {
	subject: Node;
	property: Node;
	object: Node;
}

export interface Node {
	type: 'literal' | 'uri';
	value: string;
}

export interface Binding {
	[key: string]: Node;
}

export class SPARQL {
	public static get rate_limit() {
		return get(Settings).rate_limit;
	}

	public static get size_limit() {
		return get(Settings).size_limit;
	}

	public static get endpoint() {
		return get(Settings).endpoint_url;
	}

	public static async query<T extends Binding>(body: string) {
		const urlencoded = new URLSearchParams();
		urlencoded.append('query', body);

		const result = await fetch(this.endpoint, {
			method: 'POST',

			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
				Accept: 'application/sparql-results+json'
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
		if (result.status != 200) {
			const error_message = await result.text();
			throw new Error(`SPARQL query failed: ${error_message}`);
		}

		const json = await result.json();

		const bindings: T[] = [];
		for (const binding of json.results.bindings) {
			bindings.push(binding);
		}

		return bindings;
	}

	public static async fetch_data(subject: URI, property: URI, nodes: URI[]) {
		const result = await this.query<Triple>(
			`PREFIX wikibase: <http://wikiba.se/ontology#>
			PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
			SELECT DISTINCT ?object  WHERE {
				{
				  ?object <${property}> <${subject}> .
				} UNION{
					<${subject}> <${property}> ?object
				}
				} LIMIT ${this.size_limit}`
		);

		const results: {
			uri: URI;
			label: string;
			type: 'literal' | 'uri';
			relations: {
				subject: Node;
				property: Node;
				object: Node;
				propLabel: Node;
			}[];
		}[] = [];

		const all_new_nodes = result.map((c) => c.object.value);

		for (let i = 0; i < result.length; i += this.rate_limit) {
			const new_nodes = result.slice(i, i + this.rate_limit).map((c) => c.object.value);

			const requests: { uri: URI; type: 'uri' | 'literal'; relations: any }[] = [];
			new_nodes.forEach((node) =>
				requests.push({
					uri: node,
					type: result[i].object.type,
					relations: SPARQL.fetch_relations(node, [...nodes, ...all_new_nodes])
				})
			);
			// results.push(...(await Promise.all(requests.map(r => [r.label, r.relations]))));
			for (let i = 0; i < requests.length; i++) {
				const request = requests[i];
				const r = await request.relations;
				results.push({
					uri: request.uri,
					type: request.type,
					relations: r,
					label: ''
				});
			}
		}

		const labels = await SPARQL.fetch_labels(results.map((r) => r.uri));

		for (const node of results) {
			node.label = labels.find((l) => l.uri == node.uri)?.label ?? '';
		}

		return results;
	}

	public static async fetch_image(subject: URI) {
		if (!isUrl(subject)) return undefined;
		const result = await SPARQL.query<{
			image: Node;
		}>(
			`
			PREFIX bd: <http://www.bigdata.com/rdf#>
			PREFIX wikibase: <http://wikiba.se/ontology#>
			PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
			PREFIX wdt: <http://www.wikidata.org/prop/direct/>
			SELECT DISTINCT ?image WHERE {
			  VALUES ?subject {
				<${subject}>
				  }
	
			?subject wdt:P18 ?image
			
			}
				`
		);
		if (result.length > 0) {
			return result[0].image.value;
		}

		return undefined;
	}

	public static async fetch_images(subjects: URI[]) {
		const result = await SPARQL.query<{
			image: Node;
			subject: Node;
		}>(
			`
			PREFIX bd: <http://www.bigdata.com/rdf#>
			PREFIX wikibase: <http://wikiba.se/ontology#>
			PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
			PREFIX wdt: <http://www.wikidata.org/prop/direct/>
			SELECT DISTINCT ?subject ?image WHERE {
			  VALUES ?subject {
				${subjects
					.filter((s) => isUrl(s))
					.map((s) => `<${s}>`)
					.join('\n')}
				  }
	
			?subject wdt:P18 ?image
			
			}
				`
		);
		return result.map((r) => {
			return { image: r.image.value, uri: r.subject.value };
		});
	}

	public static async fetch_labels(subjects: URI[]) {
		const result = await SPARQL.query<{
			subject: Node;
			subjectLabel: Node;
		}>(
			`
			PREFIX bd: <http://www.bigdata.com/rdf#>
			PREFIX wikibase: <http://wikiba.se/ontology#>
			PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
			SELECT DISTINCT ?subject ?subjectLabel  WHERE {
			  VALUES ?subject {
				${subjects
					.filter((s) => isUrl(s))
					.map((s) => `<${s}>`)
					.join('\n')}
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
		}

		return subjects.map((s) => ({ uri: s, label: s }));
	}

	public static async fetch_label(subject: URI) {
		if (!isUrl(subject)) return subject;

		const result = await SPARQL.query<{
			subjectLabel: Node;
		}>(
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

	public static async fetch_multiple_relations(subjects: URI[], other_nodes: URI[]) {
		const relations: {
			subject: Node;
			property: Node;
			object: Node;
			propLabel: Node;
		}[] = [];
		for (let i = 0; i < subjects.length; i += this.rate_limit) {
			const new_nodes = subjects.slice(i, i + this.rate_limit);
			const requests: Promise<
				{
					subject: Node;
					property: Node;
					object: Node;
					propLabel: Node;
				}[]
			>[] = [];
			new_nodes.forEach((node) => requests.push(SPARQL.fetch_relations(node, other_nodes)));
			relations.push(...(await (await Promise.all(requests)).flat()));
		}
		return relations;
	}

	public static async fetch_relations(subject: URI, other_nodes: URI[]) {
		if (!isUrl(subject)) return Promise.resolve([]);

		let relations = `VALUES ?object {\n`;

		for (let i = 0; i < other_nodes.length; i++) {
			const node = other_nodes[i];
			if (isUrl(node)) relations += `<${node}>\n`;
		}
		relations += '}';

		const result = await SPARQL.query(
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

	public static async fetch_property(subject: URI, property: URI): Promise<Property> {
		const result = await this.query<{
			propLabel: Node;
			outCount: Node;
			inCount: Node;
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
				LIMIT ${this.size_limit}
			}
			UNION
			{
				SELECT DISTINCT ?inObject WHERE {
				?inObject <${property}> <${subject}>.
				}
				LIMIT ${this.size_limit}
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

		throw new Error('Unable to fetch Property: ' + result);
	}

	public static async fetch_properties(
		subject: URI,
		progress_function?: (progress: number) => void
	) {
		const result = await this.query<{ property: Node }>(
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
		for (let i = 0; i < result.length; i += this.rate_limit) {
			const properties = result.slice(i, i + this.rate_limit).map((c) => c.property.value);

			const requests: Promise<Property>[] = [];
			properties.forEach((prop) => requests.push(this.fetch_property(subject, prop)));
			results.push(...((await Promise.all(requests)) as Property[]));
			if (progress_function) progress_function(Math.floor((i / result.length) * 100));
		}

		return results;
	}
}
