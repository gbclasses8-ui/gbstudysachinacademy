import { BatchItem, SubjectItem, TopicItem, MaterialItem, VideoDetailsResponse } from '../types';
import localBatches from '../data/batches.json';
import localCacheData from '../data/subjects_cache.json';

const subjectsCache: Record<string, SubjectItem[]> = (localCacheData as any).subjects || {};
const topicsCache: Record<string, TopicItem[]> = (localCacheData as any).topics || {};

// Helper to fetch with timeout
async function fetchWithTimeout(url: string, timeoutMs = 8000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

export async function fetchBatchesList(): Promise<BatchItem[]> {
  try {
    const res = await fetchWithTimeout('/batches.json', 5000);
    if (res.ok) {
      const data = await res.json();
      const list = [...(data.new || []), ...(data.old || [])];
      if (list.length > 0) return list;
    }
  } catch (err) {
    console.warn('Network error fetching batches, using local batches', err);
  }
  return [...((localBatches as any).new || []), ...((localBatches as any).old || [])];
}

export async function fetchSubjects(courseId: string): Promise<SubjectItem[]> {
  const cid = String(courseId);
  const url = `/get/allsubjectfrmlivecourseclass?courseid=${encodeURIComponent(cid)}&start=-1`;

  try {
    const res = await fetchWithTimeout(url, 8000);
    if (res.ok) {
      const json = await res.json();
      if (json.status === 200 && Array.isArray(json.data) && json.data.length > 0) {
        return json.data;
      }
    }
  } catch (err) {
    console.warn(`Upstream error for subjects of course ${cid}, checking fallback cache...`, err);
  }

  // Fallback to pre-cached subjects
  if (subjectsCache[cid] && subjectsCache[cid].length > 0) {
    return subjectsCache[cid];
  }

  throw new Error('Subjects temporarily unavailable. Please retry in a few moments.');
}

export async function fetchTopics(courseId: string, subjectId: string): Promise<TopicItem[]> {
  const cid = String(courseId);
  const sid = String(subjectId);
  const key = `${cid}_${sid}`;
  const url = `/get/alltopicfrmlivecourseclass?courseid=${encodeURIComponent(cid)}&subjectid=${encodeURIComponent(sid)}&start=-1`;

  try {
    const res = await fetchWithTimeout(url, 8000);
    if (res.ok) {
      const json = await res.json();
      if (json.status === 200 && Array.isArray(json.data)) {
        return json.data;
      }
    }
  } catch (err) {
    console.warn(`Upstream error for topics of course ${cid} subject ${sid}:`, err);
  }

  // Fallback to pre-cached topics if available
  if (topicsCache[key] && topicsCache[key].length > 0) {
    return topicsCache[key];
  }

  throw new Error('Topics temporarily unavailable. Please click retry.');
}

export async function fetchMaterials(
  courseId: string,
  subjectId: string,
  topicId: string
): Promise<MaterialItem[]> {
  const url = `/get/livecourseclassbycoursesubtopconceptapiv3?courseid=${encodeURIComponent(
    courseId
  )}&subjectid=${encodeURIComponent(subjectId)}&topicid=${encodeURIComponent(
    topicId
  )}&conceptid=&windowsapp=false&start=0`;

  try {
    const res = await fetchWithTimeout(url, 10000);
    if (res.ok) {
      const json = await res.json();
      if (json.status === 200 && Array.isArray(json.data)) {
        return json.data;
      }
    }
  } catch (err) {
    console.warn(`Error loading materials for topic ${topicId}:`, err);
  }

  // Quick retry once with fresh signal
  try {
    const res2 = await fetchWithTimeout(url, 10000);
    if (res2.ok) {
      const json2 = await res2.json();
      if (json2.status === 200 && Array.isArray(json2.data)) {
        return json2.data;
      }
    }
  } catch (err2) {
    console.warn(`Retry failed for topic ${topicId}:`, err2);
  }

  throw new Error('Lectures & notes currently loading or unavailable. Please retry.');
}

export async function fetchVideoDetails(
  courseId: string,
  videoId: string
): Promise<VideoDetailsResponse> {
  const url = `/get/fetchVideoDetailsById?course_id=${encodeURIComponent(
    courseId
  )}&video_id=${encodeURIComponent(videoId)}`;

  try {
    const res = await fetchWithTimeout(url, 10000);
    if (res.ok) {
      const json = await res.json();
      if (json && (json.success || json.decoded_video_link || (json.qualities && json.qualities.length > 0))) {
        return json;
      }
    }
  } catch (err) {
    console.warn(`Error loading video details for video ${videoId}:`, err);
  }

  // Quick retry
  try {
    const res2 = await fetchWithTimeout(url, 12000);
    if (res2.ok) {
      const json2 = await res2.json();
      if (json2 && (json2.success || json2.decoded_video_link || (json2.qualities && json2.qualities.length > 0))) {
        return json2;
      }
    }
  } catch (err2) {
    console.warn(`Retry failed for video ${videoId}:`, err2);
  }

  throw new Error('Video stream details could not be retrieved. Please retry.');
}
