import { supabase } from "../lib/supabase";

export interface StudyMaterial {
  id?: string;
  user_id?: string;
  title: string;
  description: string;
  subject: string;
  resource_url: string;
  created_at?: string;
  updated_at?: string;
}

const BUCKET_NAME = "study-materials";

/* ================================
   GET ALL STUDY MATERIALS
================================ */

export const getStudyMaterials = async (): Promise<StudyMaterial[]> => {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    throw new Error("User is not logged in");
  }

  const { data, error } = await supabase
    .from("study_materials")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching study materials:", error);
    throw error;
  }

  return Promise.all(
    (data || []).map(async (material) => {
      const filePath = getStoragePath(material.resource_url);
      if (!filePath) return material;

      const { data: signedUrlData, error: signedUrlError } =
        await supabase.storage
          .from(BUCKET_NAME)
          .createSignedUrl(filePath, 3600);

      if (signedUrlError) {
        console.error("Storage signed URL error:", signedUrlError);
        throw signedUrlError;
      }

      return {
        ...material,
        resource_url: signedUrlData.signedUrl,
      };
    })
  );
};


/* ================================
   UPLOAD STUDY MATERIAL
================================ */

export const uploadStudyMaterial = async (
  title: string,
  description: string,
  subject: string,
  file: File
): Promise<StudyMaterial> => {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    throw new Error("User is not logged in");
  }

  // Create safe file name
  const safeFileName = file.name
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9._-]/g, "");

  // Store files inside user's folder
  const filePath = `${user.id}/${Date.now()}-${safeFileName}`;

  /* Upload file to Storage */

  const { error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type,
    });

  if (uploadError) {
    console.error("Storage upload error:", uploadError);
    throw uploadError;
  }

  /* Save information in database */

  const { data, error: insertError } = await supabase
    .from("study_materials")
    .insert([
      {
        user_id: user.id,
        title: title.trim(),
        description: description.trim(),
        subject: subject.trim(),
        resource_url: filePath,
      },
    ])
    .select()
    .single();

  /* If database insertion fails,
     remove uploaded file */

  if (insertError) {
    await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath]);

    console.error("Database insert error:", insertError);
    throw insertError;
  }

  return data;
};


/* ================================
   DELETE STUDY MATERIAL
================================ */

export const deleteStudyMaterial = async (
  material: StudyMaterial
): Promise<void> => {
  if (!material.id || !material.resource_url) {
    throw new Error("Invalid study material");
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    throw new Error("User is not logged in");
  }

  /* Make sure material belongs to current user */

  if (material.user_id !== user.id) {
    throw new Error("You are not allowed to delete this material");
  }

  const filePath = getStoragePath(material.resource_url);
  if (!filePath) {
    throw new Error("Invalid storage URL");
  }

  /* Delete file from Storage */

  const { error: storageError } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([filePath]);

  if (storageError) {
    console.error("Storage delete error:", storageError);
    throw storageError;
  }

  /* Delete database record */

  const { error: dbError } = await supabase
    .from("study_materials")
    .delete()
    .eq("id", material.id)
    .eq("user_id", user.id);

  if (dbError) {
    console.error("Database delete error:", dbError);
    throw dbError;
  }
};

function getStoragePath(resourceUrl: string): string | null {
  if (!resourceUrl) return null;

  if (!resourceUrl.startsWith("http")) {
    return resourceUrl;
  }

  try {
    const url = new URL(resourceUrl);
    const markers = [
      `/storage/v1/object/public/${BUCKET_NAME}/`,
      `/storage/v1/object/sign/${BUCKET_NAME}/`,
    ];
    for (const marker of markers) {
      const index = url.pathname.indexOf(marker);
      if (index !== -1) {
        return decodeURIComponent(
          url.pathname.substring(index + marker.length)
        );
      }
    }
    return null;
  } catch {
    return null;
  }
}