-- Prevent bypass of approval workflow through direct SQL changes.
-- Apply after 0003. An approved release is immutable.
CREATE TRIGGER IF NOT EXISTS control_release_guard
BEFORE UPDATE ON control_client_releases
FOR EACH ROW
WHEN
 (OLD.status='preview' AND NEW.status='approved' AND (
   NEW.approved_by IS NULL OR NEW.approved_at IS NULL OR
   NEW.artifact_sha256<>OLD.artifact_sha256 OR NEW.site_id<>OLD.site_id
 ))
 OR (OLD.status='approved' AND NEW.status NOT IN ('approved','deploying'))
 OR (OLD.status='approved' AND (NEW.artifact_sha256<>OLD.artifact_sha256 OR NEW.approved_by<>OLD.approved_by OR NEW.approved_at<>OLD.approved_at))
 OR (OLD.status='deployed' AND (NEW.artifact_sha256<>OLD.artifact_sha256 OR NEW.status<>OLD.status))
BEGIN
 SELECT RAISE(ABORT,'release_approval_integrity_violation');
END;
