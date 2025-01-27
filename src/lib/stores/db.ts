import { DBInfo } from '@/models';
import { get, writable } from 'svelte/store';
import { db as dbAPI } from '@kksh/api/ui/iframe';
import { DB_DATATYPE_DATABASE } from '@/constants';
import * as v from 'valibot';
import { SearchModeEnum } from '@kksh/api/models';

export const createDbStore = () => {
	const databases = writable<DBInfo[]>([]);

	return {
		...databases,
		load() {
			return dbAPI
				.search({ dataType: DB_DATATYPE_DATABASE, fields: ['data', 'search_text'] })
				.then((records) => {
					const parsedBuckets = records
						.map((rec) => {
							if (!rec.data) return null;
							const parse = v.safeParse(DBInfo, { id: rec.dataId, ...JSON.parse(rec.data) });
							if (parse.success) {
								return parse.output;
							}
							console.error('Invalid database info', rec);
							return null;
						})
						.filter((rec) => rec !== null);

					console.log('parsedBuckets', parsedBuckets);
					databases.set(parsedBuckets);
				});
		},
		get() {
			return get(databases);
		},
		add(dbInfo: Omit<DBInfo, 'id'>) {
			return dbAPI.add({
				data: JSON.stringify(dbInfo),
				dataType: DB_DATATYPE_DATABASE,
				searchText: dbInfo.name
			});
		},
		dbExists(dbName: string) {
			return dbAPI.search({
				dataType: DB_DATATYPE_DATABASE,
				searchText: dbName,
				searchMode: SearchModeEnum.ExactMatch
			});
		},
		deleteById(dataId: number) {
			return dbAPI.delete(dataId);
		}
	};
};

export const dbStore = createDbStore();
