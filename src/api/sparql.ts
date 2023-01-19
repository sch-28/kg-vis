import isUrl from 'is-url';
import { Settings } from '../settings';
import { get } from 'svelte/store';
import { TypedEmitter } from 'tiny-typed-emitter';
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

export declare interface SPARQL_Events {
	'loading_related'(promise: Promise<void>): void;
	'loading_properties'(promise: Promise<void>): void;
	'loading_relations'(promise: Promise<void>): void;
}

export class SPARQL_Queries extends TypedEmitter<SPARQL_Events> {
	private readonly prefix = `
			PREFIX wdt: <http://www.wikidata.org/prop/direct/>
			PREFIX bd: <http://www.bigdata.com/rdf#>
			PREFIX wd: <http://www.wikidata.org/entity/>
			PREFIX wikibase: <http://wikiba.se/ontology#>
			PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
			PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>`;

	private current_progress: number | undefined = undefined;

	public get rate_limit() {
		return get(Settings).rate_limit;
	}

	public get size_limit() {
		return get(Settings).size_limit;
	}

	public get endpoint() {
		return get(Settings).endpoint_url;
	}

	public get progress() {
		return this.current_progress;
	}

	constructor() {
		super();
	}

	public async query<T extends Binding>(body: string) {
		const urlencoded = new URLSearchParams();
		urlencoded.append('query', this.prefix + body);

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

	public async fetch_related_nodes(subject: URI, property: URI) {
		let resolve!: () => void;
		const promise = new Promise<void>((res) => (resolve = res));
		this.emit('loading_related', promise);

		const result = await this.query<{ object: Node; objectLabel?: Node }>(
			`
			SELECT DISTINCT ?object ?objectLabel  WHERE {
				{
				  ?object <${property}> <${subject}> .
				} UNION{
					<${subject}> <${property}> ?object
				}
				OPTIONAL {
				?object rdfs:label ?objectLabel 
				FILTER (lang(?objectLabel) = 'en')
				}
				} LIMIT ${this.size_limit}`
		);
		resolve();

		const results = result.map((r) => ({
			uri: r.object.value,
			type: r.object.type,
			label: r.objectLabel?.value ?? r.object.value
		}));

		return results;
	}

	public async fetch_image(subject: URI) {
		if (!isUrl(subject)) return undefined;
		const result = await this.query<{
			image: Node;
		}>(
			`
			
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

	public async fetch_images(subjects: URI[]) {
		const result = await this.query<{
			image: Node;
			subject: Node;
		}>(
			`
			
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

	public async fetch_labels(subjects: URI[]) {
		const result = await this.query<{
			subject: Node;
			subjectLabel: Node;
		}>(
			`
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

	public async fetch_label(subject: URI) {
		if (!isUrl(subject)) return subject;

		const result = await this.query<{
			subjectLabel: Node;
		}>(
			`
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

	public async fetch_multiple_relations(subjects: URI[], other_nodes: URI[]) {
		const relations: {
			subject: Node;
			property: Node;
			object: Node;
			propLabel: Node;
		}[] = [];
		let resolve!: () => void;
		const promise = new Promise<void>((res) => (resolve = res));
		this.emit('loading_relations', promise);
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
			new_nodes.forEach((node) => requests.push(this.fetch_relations(node, other_nodes)));
			relations.push(...(await (await Promise.all(requests)).flat()));
		}
		resolve();
		return relations;
	}

	public async fetch_relations(subject: URI, other_nodes: URI[]) {
		if (!isUrl(subject)) return Promise.resolve([]);

		let relations = `VALUES ?object {\n`;

		for (let i = 0; i < other_nodes.length; i++) {
			const node = other_nodes[i];
			if (isUrl(node)) relations += `<${node}>\n`;
		}
		relations += '}';

		const result = await this.query(
			`
			
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
				${
					this.endpoint.includes('wikidata')
						? '?prop wikibase:directClaim ?property . ?prop rdfs:label ?propLabel .'
						: '?property rdf:type rdf:Property . ?property rdfs:label ?propLabel .'
				}
				
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

	public async fetch_property_count(subject: URI, property: URI): Promise<Property> {
		const result = await this.query<{
			propLabel: Node;
			outCount: Node;
			inCount: Node;
		}>(
			`
			
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
				${
					this.endpoint.includes('wikidata')
						? `?prop wikibase:directClaim <${property}> . ?prop rdfs:label ?propLabel .`
						: `<${property}> rdf:type rdf:Property . <${property}> rdfs:label ?propLabel .`
				}
			}
			
			FILTER (lang(?propLabel) = 'en')
			} GROUP BY ?propLabel`
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

	public async fetch_properties(subject: URI) {
		const result = await this.query<{ property: Node }>(
			`
			
			SELECT DISTINCT ?property  WHERE {
				{
				  ?o ?property <${subject}> .
				} UNION{
					<${subject}> ?property ?o
				}
				${
					this.endpoint.includes('wikidata')
						? '?prop wikibase:directClaim ?property .'
						: '?property rdf:type rdf:Property .'
				}
				}`
		);

		const results: Property[] = [];
		let resolve!: () => void;
		const promise = new Promise<void>((res) => (resolve = res));
		this.emit('loading_properties', promise);
		for (let i = 0; i < result.length; i += this.rate_limit) {
			const properties = result.slice(i, i + this.rate_limit).map((c) => c.property.value);

			const requests: Promise<Property>[] = [];
			properties.forEach((prop) => requests.push(this.fetch_property_count(subject, prop)));
			results.push(...((await Promise.all(requests)) as Property[]));
		}
		resolve();

		return results;
	}
}
export const SPARQL = new SPARQL_Queries();
