-- Atomically log approvals in the same SQLite statement that changes release state.
-- Requires migrations 0001 and 0002 first.
CREATE TRIGGER IF NOT EXISTS control_release_approved_audit
AFTER UPDATE OF status ON control_client_releases
FOR EACH ROW
WHEN OLD.status='preview' AND NEW.status='approved'
BEGIN
 INSERT INTO control_client_audit (id,actor_user_id,client_id,site_id,action,detail_json)
 VALUES (
  lower(hex(randomblob(16))),
  NEW.approved_by,
  (SELECT client_id FROM control_client_sites WHERE id=NEW.site_id),
  NEW.site_id,
  'release.approved',
  json_object('releaseId',NEW.id,'sha256',NEW.artifact_sha256)
 );
END;
