/** Machine-readable proposal API. This is a candidate intake API, not a code deployment action. */
export const assistantOpenApi={
 openapi:'3.1.0',
 info:{
  title:'Heavenly Key Account 4 — Restricted AI Work Gateway',
  version:'1.0.0',
  description:'ChatGPT Actions, Claude, Gemini and other compatible AI tools use an owner-generated private bearer key. Submit quarantine-only candidates, retrieve limited status, or use the stateless MCP endpoint /mcp. Every Account 4 core, credential, CMS and deployment path is protected. Nothing submitted here may be published automatically.'
 },
 servers:[{url:'https://heavenlykey-recovery-control.emmanuel2026miracle.workers.dev'}],
 paths:{
  '/api/agent/info':{
   get:{
    operationId:'getAccount4AgentCapabilities',
    summary:'Read AI bridge capabilities and the protected component policy',
    security:[{submissionToken:[]}],
    responses:{'200':{description:'Restricted AI work capabilities, no secrets'},'401':{description:'Missing or invalid key'}}
   }
  },
  '/api/proposals':{
   post:{
    operationId:'submitCodeProposalForReview',
    summary:'Submit bounded source-file proposals to Account 4 quarantine',
    description:'No production deployment occurs. 250 KB request maximum. 1–25 source files only.',
    security:[{submissionToken:[]}],
    requestBody:{required:true,content:{'application/json':{schema:{
     type:'object',additionalProperties:false,required:['schemaVersion','account','name','files'],
     properties:{
      schemaVersion:{type:'integer',const:1},
      account:{type:'string',enum:['1','2','3'],description:'1=Website; 2=Media; 3=Community'},
      name:{type:'string',minLength:3,maxLength:80},
      files:{type:'array',minItems:1,maxItems:25,items:{type:'object',required:['path','content'],additionalProperties:false,properties:{
       path:{type:'string',description:'Safe relative repository path, e.g. heavenly-key-website/index.html'},
       content:{type:'string',description:'Complete proposed source text, not executable on submission'}
      }}}
     }
    }}}},
    responses:{
     '201':{description:'Proposal accepted into quarantine only'},
     '401':{description:'Submission token missing or invalid'},
     '413':{description:'Proposal exceeds upload size'},
     '422':{description:'Unsafe or unsupported proposed file'}
    }
   }
  }
 },
 components:{securitySchemes:{submissionToken:{type:'http',scheme:'bearer',bearerFormat:'opaque',description:'One-time displayed Account 4 connector token. Cannot authorize production deployment.'}}}
} as const;
