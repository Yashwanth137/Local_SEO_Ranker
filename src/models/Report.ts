import mongoose, { Schema, Document } from 'mongoose';

export interface ICompetitor {
  title: string;
  link: string;
  snippet?: string;
  position: number;
}

export interface IKeywordIdea {
  keyword: string;
  searchVolume: string;
  difficulty: string;
}

export interface IReport extends Document {
  keyword: string;
  location: string;
  businessName?: string;
  website?: string;
  ranking: number;
  competitors: ICompetitor[];
  keywords: IKeywordIdea[];
  seoScore: number;
  insights: string;
  createdAt: Date;
}

const CompetitorSchema = new Schema({
  title: String,
  link: String,
  snippet: String,
  position: Number,
});

const KeywordIdeaSchema = new Schema({
  keyword: String,
  searchVolume: String,
  difficulty: String,
});

const ReportSchema: Schema = new Schema({
  keyword: { type: String, required: true },
  location: { type: String, required: true },
  businessName: { type: String },
  website: { type: String },
  ranking: { type: Number, default: 0 },
  competitors: [CompetitorSchema],
  keywords: [KeywordIdeaSchema],
  seoScore: { type: Number, default: 0 },
  insights: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Report || mongoose.model<IReport>('Report', ReportSchema);
