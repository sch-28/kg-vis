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

declare interface SPARQL_Events {
	'loading_related'(promise: Promise<void>): void;
	'loading_properties'(promise: Promise<void>): void;
	'loading_relations'(promise: Promise<void>): void;
	'progress'(progress: number): void;
	'error'(error: Error): void;
}

class SPARQL_Queries extends TypedEmitter<SPARQL_Events> {
	private readonly prefix = `
			PREFIX schema: <http://schema.org/>
			PREFIX wdt: <http://www.wikidata.org/prop/direct/>
			PREFIX bd: <http://www.bigdata.com/rdf#>
			PREFIX wd: <http://www.wikidata.org/entity/>
			PREFIX wikibase: <http://wikiba.se/ontology#>
			PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
			PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>`;

	private current_progress: number | undefined = undefined;

	private last_fetch: number = 0;
	private queue: string[] = [];
	private last_queue: number = 0;

	public get rate_limit() {
		return +get(Settings).rate_limit ?? 10;
	}

	public get size_limit() {
		return +get(Settings).size_limit ?? 100;
	}

	public get endpoint() {
		let endpoint = get(Settings).endpoint_url;
		if (!isUrl(endpoint) || endpoint.length === 0) {
			endpoint = 'https://query.wikidata.org/sparql';
		}
		return endpoint;
	}

	public get progress() {
		return this.current_progress;
	}

	constructor() {
		super();
		this.setMaxListeners(1);
	}

	public async query<T extends Binding>(body?: string) {
		const now = Date.now();
		const diff = now - this.last_fetch;
		if (diff < this.rate_limit && body) {
			this.queue.push(body);
			const timeout = Math.max(this.last_queue, this.last_fetch) + this.rate_limit - now;
			this.last_queue = timeout + now;

			return new Promise<T[]>((res) =>
				setTimeout(async () => {
					res(await this.query<T>());
				}, timeout)
			);
		}

		this.last_fetch = now;

		if (this.queue.length > 0 && !body) {
			body = this.queue.shift();
		}

		const urlencoded = new URLSearchParams();
		urlencoded.append('query', this.prefix + body);

		try {
			const result = await fetch(this.endpoint, {
				method: 'POST',

				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
					Accept: 'application/sparql-results+json'
				},
				body: urlencoded
			});

			if (result.status != 200) {
				const error_message = await result.text();
				throw new Error(`SPARQL query: ${error_message}`);
			}

			const json = await result.json();

			const bindings: T[] = [];
			for (const binding of json.results.bindings) {
				bindings.push(binding);
			}

			return bindings;
		} catch (e) {
			console.error(e);
			if (e instanceof Error) this.emit('error', e);
			return [];
		}
	}

	public async fetch_description(subject: URI) {
		const result = await this.query<{ description: Node }>(`

		SELECT DISTINCT ?description WHERE {
			VALUES ?subject {
				<${subject}>
			}
			?subject schema:description ?description
			FILTER (lang(?description) = 'en')
		} LIMIT 1`);

		return result[0]?.description.value ?? '';
	}

	public async fetch_related_nodes(subject: URI, property: URI, notify?: boolean) {
		let resolve!: () => void;
		const promise = new Promise<void>((res) => (resolve = res));
		notify && this.emit('loading_related', promise);

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
				  ${
						this.endpoint.includes('wikidata')
							? '?prop wikibase:directClaim ?subject . ?prop rdfs:label ?subjectLabel  '
							: '?subject rdf:type rdf:Property .  ?subject rdfs:label ?subjectLabel '
					}
			 
				  
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

	public async fetch_info(subject: URI) {
		const result = await this.query<{
			label: Node;
			description: Node;
		}>(
			`
			SELECT DISTINCT ?label ?description WHERE {
			  VALUES ?subject {
				<${subject}>
				  }
	
			OPTIONAL {
			?subject rdfs:label ?label 
			FILTER (lang(?label) = 'en')
			}
			OPTIONAL {
				?subject schema:description ?description
				FILTER (lang(?description) = 'en')
			}
			
			}
				`
		);
		if (result.length > 0) {
			return {
				label: result[0].label?.value ?? subject,
				description: result[0].description?.value ?? ''
			};
		}

		return { label: subject, description: '' };
	}

	public async fetch_multiple_relations(
		subjects: URI[],
		other_nodes: URI[],
		notify: boolean = true
	) {
		let resolve!: () => void;

		const promise = new Promise<void>((res) => (resolve = res));
		notify && this.emit('loading_relations', promise);

		const relations = (await this.fetch_relations(subjects, other_nodes)).map((r) => {
			const outgoing_property = r.dir.value === 'out';

			return {
				subject: outgoing_property ? r.subject : r.object,
				property: r.property,
				object: outgoing_property ? r.object : r.subject,
				property_label: r.property.value
			};
		});

		const labels = await this.fetch_labels(relations.map((r) => r.property.value));

		for (let i = 0; i < relations.length; i++) {
			const relation = relations[i];
			const label = labels.find((l) => l.uri === relation.property.value);
			if (label) relation.property_label = label.label;
		}

		resolve();
		return relations;
	}

	public async fetch_relations(subjects: URI[], other_nodes: URI[]) {
		let subjects_string = `VALUES ?subject {\n`;

		for (let i = 0; i < subjects.length; i++) {
			const node = subjects[i];
			if (isUrl(node)) subjects_string += `<${node}>\n`;
		}
		subjects_string += '}';

		let objects_string = `VALUES ?object {\n`;

		for (let i = 0; i < other_nodes.length; i++) {
			const node = other_nodes[i];
			if (isUrl(node)) objects_string += `<${node}>\n`;
		}
		objects_string += '}';

		const result = await this.query<{
			subject: Node;
			property: Node;
			object: Node;
			dir: Node;
		}>(
			`
			
			SELECT DISTINCT ?object ?property ?subject ?dir WHERE
			{
				${subjects_string}
				${objects_string}
				{
					BIND("in" as ?dir) . ?object ?property ?subject .
				}
				UNION
				{	
					BIND("out" as ?dir) . ?subject ?property ?object . 
				}
				
			}`
		);

		return result;
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
		} else {
			return {
				label: property,
				uri: property,
				out_count: 0,
				in_count: 0
			};
		}
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
		const properties = result.map((c) => c.property.value);
		const requests: Promise<Property>[] = [];
		properties.forEach((prop) => requests.push(this.fetch_property_count(subject, prop)));
		for (let i = 0; i < requests.length; i++) {
			results.push(await requests[i]);
			this.emit('progress', Math.floor((i / requests.length) * 100));
		}
		resolve();
		return results;
	}
}
export const SPARQL = new SPARQL_Queries();
