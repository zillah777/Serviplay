-- Fix for missing cleanup_expired_temp_files() function
-- This script creates the missing PostgreSQL function

-- Create the cleanup function if it doesn't exist
CREATE OR REPLACE FUNCTION cleanup_expired_temp_files()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Mark files as deleted
    UPDATE archivos 
    SET estado = 'deleted', deleted_at = NOW()
    WHERE id IN (
        SELECT a.id 
        FROM archivos a
        JOIN archivos_temporales at ON a.id = at.archivo_id
        WHERE at.expires_at < NOW()
          AND a.estado != 'deleted'
    );
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Delete expired temporary file records
    DELETE FROM archivos_temporales WHERE expires_at < NOW();
    
    RETURN deleted_count;
END;
$$ language 'plpgsql';

-- Test the function (optional - comment out if not needed)
-- SELECT cleanup_expired_temp_files() as deleted_count;