import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSessionProfile } from "@/lib/profile";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"];
const BUCKET_NAME = "restaurant-images";

/**
 * Uploads an image to Supabase Storage for restaurant covers or dish photos.
 * Admin-only — requires a signed-in admin session.
 */
export async function POST(request: NextRequest) {
	const { profile } = await getSessionProfile();
	if (!profile || profile.role !== "admin") {
		return NextResponse.json({ error: "Admins only." }, { status: 403 });
	}

	const formData = await request.formData();
	const file = formData.get("file") as File | null;
	// Optional: path of the previously uploaded file to delete (storage-relative path)
	const oldPath = formData.get("oldPath") as string | null;

	if (!file) {
		return NextResponse.json({ error: "No file provided." }, { status: 400 });
	}

	if (!ALLOWED_TYPES.includes(file.type)) {
		return NextResponse.json(
			{ error: "Invalid file type. Only PNG, JPEG, and WebP are allowed." },
			{ status: 400 },
		);
	}

	if (file.size > MAX_FILE_SIZE) {
		return NextResponse.json(
			{ error: "File too large. Maximum size is 5MB." },
			{ status: 400 },
		);
	}

	const supabase = createAdminClient();
	if (!supabase) {
		return NextResponse.json(
			{ error: "Storage not configured." },
			{ status: 500 },
		);
	}

	// Generate a unique filename: timestamp + random suffix
	const timestamp = Date.now();
	const randomSuffix = Math.random().toString(36).substring(2, 8);
	const extension = file.name.split(".").pop() || "jpg";
	const filename = `${timestamp}-${randomSuffix}.${extension}`;

	const { data, error } = await supabase.storage
		.from(BUCKET_NAME)
		.upload(filename, file, {
			cacheControl: "3600",
			upsert: false,
			contentType: file.type,
		});

	if (error) {
		console.error("Upload error:", error);
		return NextResponse.json(
			{ error: "Upload failed. Please try again." },
			{ status: 500 },
		);
	}

	// Delete the old file so storage doesn't accumulate orphaned images
	if (oldPath) {
		const { error: removeError } = await supabase.storage
			.from(BUCKET_NAME)
			.remove([oldPath]);
		if (removeError) {
			// Non-fatal — the new file is already uploaded; just log it
			console.warn("Failed to remove old image:", oldPath, removeError);
		}
	}

	// Get the public URL
	const { data: urlData } = supabase.storage
		.from(BUCKET_NAME)
		.getPublicUrl(data.path);

	return NextResponse.json({ url: urlData.publicUrl, path: data.path });
}
