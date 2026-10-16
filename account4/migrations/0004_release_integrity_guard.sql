-- Guard every release transition, not only approved->deploying.
-- Apply after 0003; this migration is not applied to production.
CREATE TRIGGER IF NOT EXISTS control_release_guard
BEFORE UPDATE ON control_client_releases
FOR EACH ROW
WHEN
 (NEW.status<>OLD.status AND NOT (
  (OLD.status='draft' AND NEW.status='building') OR
  (OLD.status='building' AND NEW.status IN ('preview','failed')) OR
  (OLD.status='preview' AND NEW.status IN ('approved','rejected')) OR
  (OLD.status='approved' AND NEW.status='deploying') OR
  (OLD.status='deploying' AND NEW.status IN ('deployed','failed'))
 ))
 OR (OLD.status IN ('preview','approved','deploying','deployed','rejected','failed') AND
   (NEW.artifact_sha256<>OLD.artifact_sha256 OR NEW.site_id<>OLD.site_id))
 OR (OLD.approved_by IS NOT NULL AND
   (NEW.approved_by IS NOT OLD.approved_by OR NEW.approved_at IS NOT OLD.approved_at))
 OR (NEW.status IN ('approved','deploying','deployed') AND
   (NEW.approved_by IS NULL OR NEW.approved_at IS NULL))
 OR (OLD.status='preview' AND NEW.status='approved' AND
   (NEW.approved_by IS NULL OR NEW.approved_at IS NULL))
BEGIN
 SELECT RAISE(ABORT,'release_approval_integrity_violation');
END;
