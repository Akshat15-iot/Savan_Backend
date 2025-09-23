// models/PageCompanyMap.js
import mongoose from "mongoose";

const pageCompanyMapSchema = new mongoose.Schema({
  pageId: { type: String, required: true, unique: true },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },
});

export default mongoose.model("PageCompanyMap", pageCompanyMapSchema);
