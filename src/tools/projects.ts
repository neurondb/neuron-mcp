import { Database } from "../db.js";

export class ProjectTools {
	constructor(private db: Database) {}

	async createProject(params: {
		project_name: string;
		model_type: string;
		description?: string;
	}) {
		const { project_name, model_type, description } = params;

		const query = `
			SELECT neurondb_create_ml_project($1, $2, $3) AS project_id
		`;

		const result = await this.db.query(query, [
			project_name,
			model_type,
			description || null,
		]);

		return result.rows[0];
	}

	async listProjects() {
		const query = `SELECT * FROM neurondb_list_ml_projects()`;
		const result = await this.db.query(query);
		return result.rows;
	}

	async getProjectInfo(project_name: string) {
		const query = `
			SELECT neurondb_get_project_info($1) AS info
		`;

		const result = await this.db.query(query, [project_name]);
		return result.rows[0];
	}

	async trainKMeansProject(params: {
		project_name: string;
		table_name: string;
		vector_col: string;
		num_clusters: number;
		max_iters?: number;
	}) {
		const {
			project_name,
			table_name,
			vector_col,
			num_clusters,
			max_iters = 100,
		} = params;

		const query = `
			SELECT neurondb_train_kmeans_project(
				$1, $2, $3, $4, $5
			) AS model_id
		`;

		const result = await this.db.query(query, [
			project_name,
			table_name,
			vector_col,
			num_clusters,
			max_iters,
		]);

		return result.rows[0];
	}

	async deployModel(params: {
		project_name: string;
		version?: number;
	}) {
		const { project_name, version } = params;

		const query = `
			SELECT neurondb_deploy_model($1, $2) AS deployment_id
		`;

		const result = await this.db.query(query, [
			project_name,
			version || null,
		]);

		return result.rows[0];
	}

	async listProjectModels(project_name: string) {
		const query = `
			SELECT * FROM neurondb_list_project_models($1)
		`;

		const result = await this.db.query(query, [project_name]);
		return result.rows;
	}
}

