-- Create RPC for efficient student attendance summary calculation
-- Run this in Supabase SQL Editor

CREATE OR REPLACE FUNCTION get_student_attendance_summary(p_student_id UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
    overall_stats JSON;
    subject_stats JSON[];
BEGIN
    -- Calculate overall stats
    SELECT json_build_object(
        'total', COUNT(*),
        'attended', COUNT(*) FILTER (WHERE a.status = 'present'),
        'percentage', ROUND(
            (COUNT(*) FILTER (WHERE a.status = 'present')::DECIMAL /
             NULLIF(COUNT(*), 0)) * 100, 0
        )::INTEGER
    ) INTO overall_stats
    FROM attendance a
    JOIN sessions s ON a.session_id = s.id
    WHERE a.student_id = p_student_id
    AND s.status IN ('submitted', 'edited');

    -- Calculate per-subject stats
    SELECT array_agg(
        json_build_object(
            'subject', json_build_object(
                'id', sub.id,
                'name', sub.name,
                'code', sub.code
            ),
            'total', stats.total,
            'attended', stats.attended,
            'absent', stats.total - stats.attended,
            'percentage', ROUND((stats.attended::DECIMAL / NULLIF(stats.total, 0)) * 100, 0)::INTEGER
        )
    ) INTO subject_stats
    FROM (
        SELECT
            s.actual_subject_id,
            COUNT(*) as total,
            COUNT(*) FILTER (WHERE a.status = 'present') as attended
        FROM attendance a
        JOIN sessions s ON a.session_id = s.id
        WHERE a.student_id = p_student_id
        AND s.status IN ('submitted', 'edited')
        GROUP BY s.actual_subject_id
    ) stats
    JOIN subjects sub ON stats.actual_subject_id = sub.id;

    -- Get class name
    SELECT json_build_object(
        'className', c.name,
        'overall', overall_stats,
        'subjects', COALESCE(subject_stats, '{}')
    ) INTO result
    FROM students st
    JOIN classes c ON st.class_id = c.id
    WHERE st.id = p_student_id;

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;