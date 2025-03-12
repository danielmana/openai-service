require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();

// Enable CORS for all requests
app.use(
  cors({
    // Allowed origins
    origin: [
      "http://localhost:3001",
      "http://localhost:3000",
      "https://*.isbuildingluma.com",
      "https://*.lumahealthstaging.com",
      "https://*.lumahealth.io",
    ],
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const TOKEN = process.env.TOKEN;

app.post("/ai-workflows", async (req, res) => {
  try {
    const response = await axios.post(
      "https://ai-api.red.isbuildingluma.com/chat/completions",
      {
        model: "gpt-4o",
        metadata: { token: TOKEN },
        messages: [
          {
            role: "system",
            content: `
You are an AI that converts natural language into structured automation workflows.

Given the following predefined models and actions:

EFollowupModel:
- activity: When an activity occurs
- appointment: When an appointment is scheduled or updated
- appointmentType: When an appointment type is defined
- availability: When availability changes
- billingTransaction: When a billing transaction is processed
- broadcast: When a broadcast message is sent
- campaign: When a campaign is launched
- chatActivity: When chat activity is detected
- chatActivityReason: When a chat activity reason is logged
- diagnosis: When a diagnosis is made
- estimate: When an estimate is created
- facility: When a facility is updated
- feedbackResponse: When feedback is received
- fileUpload: When a file is uploaded
- group: When a group is modified
- hl7message: When an HL7 message is received
- insurance: When insurance information is updated
- integrator: When an integrator event occurs
- intent: When an intent is recognized
- lumaBotFlow: When a LumaBot flow is initiated
- lumaBotFlowTemplate: When a LumaBot flow template is used
- message: When a message is sent
- messageTemplate: When a message template is applied
- messageTemplatePartial: When a partial message template is used
- offer: When an offer is made
- outboundNumber: When an outbound number is used
- patient: When patient information is updated
- patientForm: When a patient form is submitted
- patientFormTemplate: When a patient form template is used
- patientMessageTemplate: When a patient message template is sent
- procedure: When a procedure is performed
- provider: When a provider is updated
- recall: When a recall is initiated
- referral: When a referral is made
- reminder: When a reminder is set
- schedule: When a schedule is updated
- telehealth: When a telehealth session is scheduled
- user: When a user action is detected
- waitingRoomPatient: When a patient enters the waiting room
- waitlist: When a patient joins the waitlist

EFollowupAction:
- send-message: Send a message to a patient
- alert-staff: Alert staff members
- start-bot: Start a bot session
- https-webhook: Trigger an HTTPS webhook
- confirm-appointment: Confirm an appointment
- cancel-appointment: Cancel an appointment
- arrive-appointment: Mark an appointment as arrived
- create-referral: Create a referral
- cancel-referral: Cancel a referral
- open-chat: Open a chat session
- close-chat: Close a chat session
- internal-chat: Send an internal chat message
- join-waitlist: Add a patient to the waitlist
- leave-waitlist: Remove a patient from the waitlist
- join-waiting-room: Add a patient to the waiting room
- send-physical-mail: Send physical mail to a patient
- create-patient-in-integrator: Create a patient in the integrator
- execute-javascript: Execute a JavaScript function
- assign-chat: Assign a chat to a staff member
- send-slack-message: Send a message to a Slack channel
- send-teams-message: Send a message to a Teams channel
- create-salesforce-record: Create a record in Salesforce
- wait: Wait for a specified duration
- if: Conditional logic execution
- none: No action
- set-context: Set a context for the workflow
- execute-assistant-tool: Execute an assistant tool
- invoke-integrator-api: Call an integrator API
- invoke-rest-api: Call a REST API
- invoke-fhir-api: Call a FHIR API
- invoke-navigator: Use the Spark Navigator

Convert the following user request into a structured workflow JSON that uses these triggers and actions:

User request: "When an appointment is updated send a message"

Example output:
\`\`\`json 
{
    "name": "Appointment Update Workflow",
    "description": "Workflow triggered by appointment updates",
    "followups": {
        "followup": {
            "title": "Appointment Updated",
            "model": "appointment"
        },
        "true": {
            "followup": {
                "title": "Send a message to a patient",
                "action": "send-message",
            },
        }
    }
}
\`\`\`

Output type has to match the IFollowupWorkflow interface:
\`\`\`json 
interface IFollowupWorkflowTree {
  true?: IFollowupWorkflowTree;
  followup: {
    title: string;
    action: EFollowupAction;
    model: EFollowupModel;
  };
}

interface IFollowupWorkflow {
  name: string;
  description?: string;
  followups: IFollowupWorkflowTree;
}
\`\`\`
`,
          },
          {
            role: "user",
            content: req.body.prompt,
          },
        ],
        temperature: 0.2,
      },
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    // Extract the workflow JSON from the response
    const messageContent = response.data.choices[0].message.content;
    const jsonStart = messageContent.indexOf("{");
    const jsonEnd = messageContent.lastIndexOf("}") + 1;
    const workflowJson = messageContent.substring(jsonStart, jsonEnd);

    res.json(JSON.parse(workflowJson));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
