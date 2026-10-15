export function validateWorkerPost(input) {
 const errors=[];
 const author=input && input.author;
 if (!author || author.verifiedMinistryWorker !== true || author.workerGroup !== 'heavenly-12') errors.push('Verified Heavenly 12 worker required');
 const post=input && input.post || {};
 if (typeof post.body !== 'string' || post.body.trim().length < 40) errors.push('Complete message required');
 if (!input || input.scriptureVerified !== true) errors.push('Scripture review required');
 if (!input || input.ministryClaimsVerified !== true) errors.push('Ministry facts review required');
 const editor=input && input.approvedBy;
 if (!editor || editor.canApproveMinistryPosts !== true || editor.id === author?.id) errors.push('Separate authorized editor approval required');
 return {ok:errors.length===0,errors,policy:'/community/heavenly-12-faith-policy.json'};
}
