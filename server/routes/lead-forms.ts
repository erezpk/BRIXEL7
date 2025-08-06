import { Router } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { requireAuth } from "../middleware/auth";

const router = Router();

// Schema for lead form creation
const createLeadFormSchema = z.object({
  name: z.string().min(1, "Form name is required"),
  title: z.string().min(1, "Form title is required"), 
  description: z.string().optional(),
  fields: z.array(z.object({
    type: z.string(),
    label: z.string(),
    required: z.boolean(),
    options: z.array(z.string()).optional(),
  })),
  redirectUrl: z.string().url().optional().or(z.literal("")),
});

// Get all lead forms for agency
router.get("/", requireAuth, async (req, res) => {
  try {
    const agencyId = req.user!.agencyId;
    if (!agencyId) {
      return res.status(400).json({ message: "Missing agency ID" });
    }
    const forms = await storage.getLeadForms(agencyId);
    res.json(forms);
  } catch (error) {
    console.error("Error fetching lead forms:", error);
    res.status(500).json({ message: "שגיאה בטעינת טפסי הלידים" });
  }
});

// Create new lead form
router.post("/", requireAuth, async (req, res) => {
  try {
    const validatedData = createLeadFormSchema.parse(req.body);
    const agencyId = req.user!.agencyId;
    if (!agencyId) {
      return res.status(400).json({ message: "Missing agency ID" });
    }
    
    const formData = {
      ...validatedData,
      agencyId,
      publicUrl: `/public/form/${Date.now()}`, // Generate unique URL
      embedCode: `<iframe src="${process.env.BASE_URL}/public/form/${Date.now()}" width="400" height="500"></iframe>`,
    };

    const form = await storage.createLeadForm(formData);
    res.status(201).json(form);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid form data", errors: error.errors });
    }
    console.error("Error creating lead form:", error);
    res.status(500).json({ message: "שגיאה ביצירת טופס הלידים" });
  }
});

// Get form submissions
router.get("/:formId/submissions", requireAuth, async (req, res) => {
  try {
    const agencyId = req.user!.agencyId;
    if (!agencyId) {
      return res.status(400).json({ message: "Missing agency ID" });
    }
    const submissions = await storage.getFormSubmissions(req.params.formId, agencyId);
    res.json(submissions);
  } catch (error) {
    console.error("Error fetching form submissions:", error);
    res.status(500).json({ message: "שגיאה בטעינת הגשות הטופס" });
  }
});

// Public form endpoint (no auth required)
router.get("/public/:formId", async (req, res) => {
  try {
    const form = await storage.getPublicLeadForm(req.params.formId);
    if (!form || !form.isActive) {
      return res.status(404).json({ message: "Form not found" });
    }
    res.json(form);
  } catch (error) {
    console.error("Error fetching public form:", error);
    res.status(500).json({ message: "שגיאה בטעינת הטופס" });
  }
});

// Submit form (public endpoint)
router.post("/public/:formId/submit", async (req, res) => {
  try {
    const form = await storage.getPublicLeadForm(req.params.formId);
    if (!form || !form.isActive) {
      return res.status(404).json({ message: "Form not found" });
    }

    const submissionData = {
      formId: req.params.formId,
      agencyId: form.agencyId,
      submissionData: req.body,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      referrer: req.get('Referer'),
    };

    const submission = await storage.createFormSubmission(submissionData);
    
    // Optionally create lead from submission
    if (req.body.name || req.body.email) {
      const leadData = {
        name: req.body.name || req.body.email,
        email: req.body.email,
        phone: req.body.phone,
        source: 'website_form',
        agencyId: form.agencyId,
        customFields: req.body,
      };
      
      const lead = await storage.createLead(leadData);
      await storage.linkSubmissionToLead(submission.id, lead.id);
    }

    res.json({ 
      success: true, 
      message: "Form submitted successfully",
      redirectUrl: form.redirectUrl 
    });
  } catch (error) {
    console.error("Error submitting form:", error);
    res.status(500).json({ message: "שגיאה בשליחת הטופס" });
  }
});

export default router;