<script lang="ts">
	// functions
	import { onMount, tick } from "svelte";
	import { toast } from "svelte-sonner";
	// @ts-ignore
	import * as pdfjsLib from "pdfjs-dist?client";

	//stores
	import { screenWidthStore } from "$lib/stores";

	//components - custom
	import AnyPicker from "./AnyPicker.svelte";

	//componenets - shadcn
	import Button from "./ui/button/button.svelte";
	import Label from "./ui/label/label.svelte";
	import { Spinner } from "./ui/spinner";

	//icons
	import {
		Cctv,
		Images,
		Upload,
		MoveLeft,
		RotateCcw,
		Rows2,
		Camera,
		Circle,
		FocusIcon,
	} from "@lucide/svelte";

	interface Props {
		idNum: string;
	}

	const { idNum }: Props = $props();

	let cvReady = $state<boolean>(false);
	let cv = $state<any>(undefined);

	onMount(() => {
		// Listen for global OpenCV ready event
		window.addEventListener("opencv-ready", () => {
			// @ts-ignore
			cv = window.cv;
			cvReady = true;
		});

		// If OpenCV already loaded
		// @ts-ignore
		if (window.cv) {
			// @ts-ignore
			cv = window.cv;
			cvReady = true;
		}

		// @ts-ignore
		pdfjsLib.GlobalWorkerOptions.workerSrc = `/workers/pdf.worker.min.js`;

		// @ts-ignore load pdf-lib
		if (!window.PDFLib) {
			const script = document.createElement("script");
			script.src = "https://cdn.jsdelivr.net/npm/pdf-lib/dist/pdf-lib.min.js";
			document.head.appendChild(script);
		}
	});

	let isMobile = $derived<boolean>($screenWidthStore < 1025);

	const onOpenCvReady = () => {
		// @ts-ignore
		if (cv) {
			//@ts-ignore
			cv = window.cv;
			cvReady = true;
		}

		/* Deprecated
                if (window && document) {

                    document.getElementById("status").textContent =
                        "Ready. Select an image.";
                    document.getElementById("status").className = "success";
                    document.getElementById("fileInput").disabled = false;
                }
                */
	};

	let kycType = $state<"poi" | "poa" | "selfie" | "aco">("poi");
	let selectedOption = $state<"live" | "upload" | "pdf" | "none">("none");
	let selectedFile = $state<File | Blob | undefined>(undefined);
	let kycFiles = $state<(File | Blob)[]>([]);

	let corners = $state<{
		tl: null | [number, number];
		tr: null | [number, number];
		br: null | [number, number];
		bl: null | [number, number];
	}>({ tl: null, tr: null, br: null, bl: null });
	let cornerOrder = $state<[string, string, string, string]>(["tl", "tr", "br", "bl"]);
	let currentCornerIndex = $state<number>(0);

	const CORNER_RADIUS = 8;
	const CORNER_COLOR = "#00ff00";

	// A4 dimensions at 150 DPI (for web)
	const A4_WIDTH = 1240;
	const A4_HEIGHT = 1754;
	const A4_MARGIN = 80;

	let originalImage = $state<HTMLImageElement | undefined>(undefined);
	let processedImageCanvas = $state<HTMLCanvasElement | undefined>(undefined);
	let processedPdfCanvas = $state<HTMLCanvasElement[] | undefined>(undefined);
	let pdfSrc = $state<string>("");
	let imgSrcs = $state<string[]>([]);
	let liveBlobs = $state<Blob[]>([]);

	let previewReady = $state<boolean>(false);
	let loading = $state<boolean>(false);

	const reset = ({
		keepFile,
		redrawCanvas,
		toMain,
	}: {
		keepFile?: boolean;
		redrawCanvas?: boolean;
		toMain?: boolean;
	}) => {
		if (!keepFile) {
			selectedFile = undefined;
		}

		if (toMain) {
			selectedOption = "none";
			imgSrcs = [];
			liveBlobs = [];
		}

		if (redrawCanvas) {
			const _canvas = document.getElementById("originalCanvas");

			if (!_canvas) return;

			const canvas = _canvas as HTMLCanvasElement;

			const ctx = canvas.getContext("2d");

			if (!ctx) return;

			if (!originalImage) return;

			ctx.drawImage(originalImage, 0, 0);
		}

		currentCornerIndex = 0;
		processedImageCanvas = undefined;
		corners = { tl: null, tr: null, br: null, bl: null };
	};

	const initPhotoUpload = () => {
		const input = document.getElementById("image-input");

		if (!input) {
			toast.error("Please try again after one minute.");
			return;
		}

		input.click();
	};

	const handlePhotoUpload = async (e: any) => {
		const f = e.target.files as File[];

		if (!f.length) {
			toast.error("You must select a photo, or try a different option.");
			return;
		}

		selectedOption = "upload";

		selectedFile = f[0];

		await tick();

		// console.log({ selectedFile });

		const reader = new FileReader();
		reader.onload = (event) => {
			const img = new Image();
			img.onload = () => {
				originalImage = img;
				const _canvas = document.getElementById("originalCanvas");

				if (!_canvas) {
					toast.error("Please select a photo.");
					return;
				}

				const canvas = _canvas as HTMLCanvasElement;

				canvas.width = img.width;
				canvas.height = img.height;
				const ctx = canvas.getContext("2d");

				if (!ctx) {
					toast.error("Please refresh and try again.");
					return;
				}

				// console.log("Canvas found, drawing image...", canvas.width, canvas.height);
				ctx.drawImage(img, 0, 0);

				canvas.style.display = "block";

				// Reset corners
				corners = { tl: null, tr: null, br: null, bl: null };
				currentCornerIndex = 0;
			};
			// @ts-ignore
			img.src = event.target.result;
		};
		reader.readAsDataURL(selectedFile);
	};

	const initPdfUpload = () => {
		const input = document.getElementById("pdf-input");

		if (!input) {
			toast.error("Please try again after one minute.");
			return;
		}

		input.click();
	};

	const handlePdfUpload = async (e: any) => {
		const f = e.target.files as File[];

		if (!f.length) {
			toast.error("You must select a photo, or try a different option.");
			return;
		}

		selectedOption = "pdf";

		selectedFile = f[0];

		await tick();

		const arrayBuffer = await f[0].arrayBuffer();
		const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;

		const pageCount = pdf.numPages;
		const processedCanvases: HTMLCanvasElement[] = [];

		// Process each page through transforms
		for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
			const page = await pdf.getPage(pageNum);
			const viewport = page.getViewport({ scale: 2 });

			// Render to canvas
			const canvas = document.createElement("canvas");
			canvas.width = viewport.width;
			canvas.height = viewport.height;
			const ctx = canvas.getContext("2d");

			if (!ctx) {
				toast.error("EHP1 - Please refresh the browser and try again.");
				return;
			}

			await page.render({ canvasContext: ctx, viewport }).promise;

			// Apply contrast transform
			const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
			const data = imageData.data;
			for (let i = 0; i < data.length; i += 4) {
				data[i] = Math.min(255, Math.max(0, data[i] * 1.3 + 10));
				data[i + 1] = Math.min(255, Math.max(0, data[i + 1] * 1.3 + 10));
				data[i + 2] = Math.min(255, Math.max(0, data[i + 2] * 1.3 + 10));
			}
			ctx.putImageData(imageData, 0, 0);

			const availableWidth = A4_WIDTH - A4_MARGIN * 2;
			const availableHeight = A4_HEIGHT - A4_MARGIN * 2;
			const scale = Math.min(availableWidth / canvas.width, availableHeight / canvas.height);
			const scaledWidth = Math.round(canvas.width * scale);
			const scaledHeight = Math.round(canvas.height * scale);

			const a4Canvas = document.createElement("canvas");
			a4Canvas.width = A4_WIDTH;
			a4Canvas.height = A4_HEIGHT;
			const a4Ctx = a4Canvas.getContext("2d");

			if (!a4Ctx) {
				toast.error("EHP2 - Please refresh the browser and try again.");
				return;
			}

			a4Ctx.fillStyle = "#ffffff";
			a4Ctx.fillRect(0, 0, A4_WIDTH, A4_HEIGHT);

			const offsetX = (A4_WIDTH - scaledWidth) / 2;
			const offsetY = (A4_HEIGHT - scaledHeight) / 2;
			a4Ctx.drawImage(canvas, offsetX, offsetY, scaledWidth, scaledHeight);

			processedCanvases.push(a4Canvas);
		}

		// Store processed canvases
		processedPdfCanvas = processedCanvases;

		// Create preview PDF from all processed pages
		// @ts-ignore
		const { PDFDocument } = window.PDFLib;
		const previewPdfDoc = await PDFDocument.create();

		for (const a4Canvas of processedCanvases) {
			await new Promise<void>((resolve) => {
				a4Canvas.toBlob(
					async (blob) => {
						const arrayBuf = await blob!.arrayBuffer();
						const page = previewPdfDoc.addPage([1240, 1754]);
						const jpegImage = await previewPdfDoc.embedJpg(arrayBuf);
						page.drawImage(jpegImage, {
							x: 0,
							y: 0,
							width: 1240,
							height: 1754,
						});
						resolve();
					},
					"image/jpeg",
					0.7,
				);
			});
		}

		// Convert to blob and show in iframe
		const pdfBytes = await previewPdfDoc.save();
		const pdfBlob = new Blob([pdfBytes], { type: "application/pdf" });
		selectedFile = pdfBlob;
		const blobUrl = URL.createObjectURL(pdfBlob);

		pdfSrc = blobUrl;
	};

	const drawCorners = (canvas: HTMLCanvasElement) => {
		const ctx = canvas.getContext("2d");

		if (!ctx) {
			toast.error("ECT3 - Please refresh the browser and try again.");
			return;
		}

		const cornerKeys = ["tl", "tr", "br", "bl"];
		const labels = ["TL", "TR", "BR", "BL"];

		cornerKeys.forEach((_key, idx) => {
			const key = _key as "tl" | "tr" | "br" | "bl";
			if (corners[key]) {
				const [x, y] = corners[key];
				// Draw circle
				ctx.beginPath();
				ctx.arc(x, y, CORNER_RADIUS, 0, 2 * Math.PI);
				ctx.fillStyle = CORNER_COLOR;
				ctx.fill();
				ctx.strokeStyle = "#000";
				ctx.lineWidth = 2;
				ctx.stroke();

				// Draw label
				ctx.fillStyle = "#000";
				ctx.font = `bold 12px "Google Sans Code"`;
				ctx.fillText(labels[idx], x + 15, y - 10);
			}
		});

		// Draw lines connecting corners if all selected
		if (corners.tl && corners.tr && corners.br && corners.bl) {
			ctx.strokeStyle = CORNER_COLOR;
			ctx.lineWidth = 2;
			ctx.setLineDash([5, 5]);
			ctx.beginPath();
			ctx.moveTo(corners.tl[0], corners.tl[1]);
			ctx.lineTo(corners.tr[0], corners.tr[1]);
			ctx.lineTo(corners.br[0], corners.br[1]);
			ctx.lineTo(corners.bl[0], corners.bl[1]);
			ctx.closePath();
			ctx.stroke();
			ctx.setLineDash([]);
		}
	};

	const canvasClickHandler = (e: any) => {
		if (!originalImage) return;

		const _canvas = document.getElementById("originalCanvas");

		if (!_canvas) {
			toast.error("EC1 - Please refresh the browser and try again.");
			return;
		}

		const canvas = _canvas as HTMLCanvasElement;

		const rect = canvas.getBoundingClientRect();
		const x = e.clientX - rect.left;
		const y = e.clientY - rect.top;

		// Account for canvas scaling
		const scaleX = canvas.width / rect.width;
		const scaleY = canvas.height / rect.height;
		const actualX = x * scaleX;
		const actualY = y * scaleY;

		const cornerName = cornerOrder[currentCornerIndex] as "tl" | "tr" | "br" | "bl";
		corners[cornerName] = [Math.round(actualX), Math.round(actualY)];

		// Redraw canvas with new corner
		const ctx = canvas.getContext("2d");

		if (!ctx) {
			toast.error("ECT1 - Please refresh the browser and try again.");
			return;
		}

		ctx.drawImage(originalImage, 0, 0);
		drawCorners(canvas);

		currentCornerIndex++;
		currentCornerIndex = currentCornerIndex;

		/*
					if (currentCornerIndex === 4) {
						previewReady = true
					}
                    */
	};

	const previewScan = async () => {
		if (originalImage) {
			try {
				// Create canvas from original image
				const canvas = document.createElement("canvas");
				canvas.width = originalImage.width;
				canvas.height = originalImage.height;
				const ctx = canvas.getContext("2d");

				if (!ctx) {
					toast.error("EP3 - Please try uploading again or refresh the browser.");
					return;
				}

				ctx.drawImage(originalImage, 0, 0);

				const src = cv.imread(canvas);

				if (!corners.tl || !corners.tr || !corners.br || !corners.bl) {
					toast.error("EP4 - Please try uploading again or refresh the browser.");
					return;
				}

				// Perspective transform using user-selected corners
				const srcTri = cv.matFromArray(4, 1, cv.CV_32FC2, [
					corners.tl[0],
					corners.tl[1],
					corners.tr[0],
					corners.tr[1],
					corners.br[0],
					corners.br[1],
					corners.bl[0],
					corners.bl[1],
				]);

				const widthTop = Math.hypot(corners.tr[0] - corners.tl[0], corners.tr[1] - corners.tl[1]);
				const widthBottom = Math.hypot(
					corners.br[0] - corners.bl[0],
					corners.br[1] - corners.bl[1],
				);
				const heightLeft = Math.hypot(corners.bl[0] - corners.tl[0], corners.bl[1] - corners.tl[1]);
				const heightRight = Math.hypot(
					corners.br[0] - corners.tr[0],
					corners.br[1] - corners.tr[1],
				);

				const width = Math.max(widthTop, widthBottom);
				const height = Math.max(heightLeft, heightRight);

				const dstTri = cv.matFromArray(4, 1, cv.CV_32FC2, [
					0,
					0,
					width,
					0,
					width,
					height,
					0,
					height,
				]);

				const M = cv.getPerspectiveTransform(srcTri, dstTri);
				const warped = new cv.Mat();
				cv.warpPerspective(src, warped, M, new cv.Size(width, height));

				/* Grayscale Setting
                // Convert to grayscale
                const grayResult = new cv.Mat();
                cv.cvtColor(warped, grayResult, cv.COLOR_RGB2GRAY);
    
                // Apply contrast
                const contrast = new cv.Mat();
                cv.convertScaleAbs(grayResult, contrast, 1.3, 10);
                */

				// ? begin colour processing
				// Keep in color - apply contrast to each channel
				const contrast = new cv.Mat();
				cv.convertScaleAbs(warped, contrast, 1.1, 10);
				// ? end colour processing

				// Scale to fit A4 with margins
				const availableWidth = A4_WIDTH - A4_MARGIN * 2;
				const availableHeight = A4_HEIGHT - A4_MARGIN * 2;
				const scale = Math.min(availableWidth / width, availableHeight / height);
				const scaledWidth = Math.round(width * scale);
				const scaledHeight = Math.round(height * scale);

				const resized = new cv.Mat();
				cv.resize(contrast, resized, new cv.Size(scaledWidth, scaledHeight));

				// Create A4 canvas with white background
				const a4Canvas = document.createElement("canvas") as HTMLCanvasElement;
				a4Canvas.width = A4_WIDTH;
				a4Canvas.height = A4_HEIGHT;
				const a4Ctx = a4Canvas.getContext("2d");

				if (!a4Ctx) {
					toast.error("EP5 - Please try uploading again or refresh the browser.");
					return;
				}

				// White background
				a4Ctx.fillStyle = "#ffffff";
				a4Ctx.fillRect(0, 0, A4_WIDTH, A4_HEIGHT);

				// Center document on A4
				const offsetX = (A4_WIDTH - scaledWidth) / 2;
				const offsetY = (A4_HEIGHT - scaledHeight) / 2;

				// Draw resized image onto white background
				const tempCanvas = document.createElement("canvas");
				tempCanvas.width = scaledWidth;
				tempCanvas.height = scaledHeight;
				cv.imshow(tempCanvas, resized);

				a4Ctx.drawImage(tempCanvas, offsetX, offsetY, scaledWidth, scaledHeight);

				previewReady = true;

				await tick();

				// Display preview
				const _previewCanvas = document.getElementById("previewCanvas");

				if (!_previewCanvas) {
					toast.error("EP6 - Please try uploading again or refresh the browser.");
					return;
				}

				const previewCanvas = _previewCanvas as HTMLCanvasElement;

				previewCanvas.width = A4_WIDTH;
				previewCanvas.height = A4_HEIGHT;
				const previewCtx = previewCanvas.getContext("2d");

				if (!previewCtx) {
					toast.error("EP7 - Please try uploading again or refresh the browser.");
					return;
				}

				previewCtx.drawImage(a4Canvas, 0, 0);
				previewCanvas.style.display = "block";

				processedImageCanvas = a4Canvas;

				// Cleanup
				src.delete();
				srcTri.delete();
				dstTri.delete();
				M.delete();
				warped.delete();
				//grayResult.delete();
				contrast.delete();
				resized.delete();
			} catch (error) {
				toast.error("EP2 - Please try uploading again or refresh the browser.");
			}
		} else {
			toast.error("EP1 - Please try uploading again or refresh the browser.");
		}
	};

	let videoEl = $state<HTMLVideoElement | undefined>(undefined);
	let kycBegin = $state<boolean>(false);

	/* Deprecated
	let liveCanvases = $state<HTMLCanvasElement[]>([]);
	let liveCorners = $state<{
		[key: number]: {
			tl: null | [number, number];
			tr: null | [number, number];
			br: null | [number, number];
			bl: null | [number, number];
		};
	}>({});
	let currentPhotoIndex = $state<number>(0);
	let photoPreviewReady = $state<boolean>(false);

	const capturePhotoMultiple = () => {
		const c = document.createElement("canvas");

		if (!videoEl) return;

		c.width = videoEl.videoWidth;
		c.height = videoEl.videoHeight;

		const ctx = c.getContext("2d");

		if (!ctx) return;

		// mirror horizontally
		ctx.scale(-1, 1);
		ctx.drawImage(videoEl, -c.width, 0, c.width, c.height);

		c.toBlob(
			(blob) => {
				if (blob) {
					liveBlobs.push(blob);
					liveBlobs = liveBlobs;
					const blobUrl = URL.createObjectURL(blob);
					imgSrcs.push(blobUrl);
					imgSrcs = imgSrcs;

					// Create canvas for this photo - draw directly from blob
					const photoCanvas = document.createElement("canvas");
					const img = new Image();
					img.onload = () => {
						// Set canvas to match image dimensions
						photoCanvas.width = img.width;
						photoCanvas.height = img.height;

						c.width = img.width;
						c.height = img.height;
						const photoCtx = photoCanvas.getContext("2d");
						if (photoCtx) {
							photoCtx.drawImage(img, 0, 0); // Draw full image
						}
						liveCanvases.push(photoCanvas);
						liveCanvases = liveCanvases;

						// Initialize corners for this photo
						const idx = liveCanvases.length - 1;
						liveCorners[idx] = { tl: null, tr: null, br: null, bl: null };
						liveCorners = liveCorners;
					};

					img.src = blobUrl; // Use the same blob URL

					c.remove();
				}
			},
			"image/png",
			0.7,
		);
	};
	*/

	/*drawLiveCorners deprecated
	const drawLiveCorners = (canvasId: string, photoIdx: number) => {
		const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
		if (!canvas) return;

		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		const cornerKeys = ["tl", "tr", "br", "bl"];
		const labels = ["TL", "TR", "BR", "BL"];

		cornerKeys.forEach((_key, idx) => {
			const key = _key as "tl" | "tr" | "br" | "bl";
			if (liveCorners[photoIdx]?.[key]) {
				const [x, y] = liveCorners[photoIdx][key];
				ctx.beginPath();
				ctx.arc(x, y, CORNER_RADIUS, 0, 2 * Math.PI);
				ctx.fillStyle = CORNER_COLOR;
				ctx.fill();
				ctx.strokeStyle = "#000";
				ctx.lineWidth = 2;
				ctx.stroke();

				ctx.fillStyle = "#000";
				ctx.font = `bold 12px "Google Sans Code"`;
				ctx.fillText(labels[idx], x + 15, y - 10);
			}
		});

		if (
			liveCorners[photoIdx]?.tl &&
			liveCorners[photoIdx]?.tr &&
			liveCorners[photoIdx]?.br &&
			liveCorners[photoIdx]?.bl
		) {
			ctx.strokeStyle = CORNER_COLOR;
			ctx.lineWidth = 2;
			ctx.setLineDash([5, 5]);
			ctx.beginPath();
			ctx.moveTo(liveCorners[photoIdx].tl![0], liveCorners[photoIdx].tl![1]);
			ctx.lineTo(liveCorners[photoIdx].tr![0], liveCorners[photoIdx].tr![1]);
			ctx.lineTo(liveCorners[photoIdx].br![0], liveCorners[photoIdx].br![1]);
			ctx.lineTo(liveCorners[photoIdx].bl![0], liveCorners[photoIdx].bl![1]);
			ctx.closePath();
			ctx.stroke();
			ctx.setLineDash([]);
		}
	};
	*/

	/*liveCanvasClickHandler deprecated
	const liveCanvasClickHandler = (photoIdx: number) => {
		return (e: any) => {
			const canvas = document.getElementById(`liveCanvas-${photoIdx}`) as HTMLCanvasElement;
			if (!canvas) return;

			const rect = canvas.getBoundingClientRect();
			const x = e.clientX - rect.left;
			const y = e.clientY - rect.top;

			const scaleX = canvas.width / rect.width;
			const scaleY = canvas.height / rect.height;
			const actualX = x * scaleX;
			const actualY = y * scaleY;

			const cornerOrder = ["tl", "tr", "br", "bl"];
			const currentIdx = Object.keys(liveCorners[photoIdx]).filter(
				(k) => liveCorners[photoIdx][k as "tl" | "tr" | "br" | "bl"] !== null,
			).length;

			if (currentIdx < 4) {
				const cornerName = cornerOrder[currentIdx] as "tl" | "tr" | "br" | "bl";
				liveCorners[photoIdx][cornerName] = [Math.round(actualX), Math.round(actualY)];
				liveCorners = liveCorners;

				// Redraw canvas with new corner
				const ctx = canvas.getContext("2d");
				if (ctx && liveCanvases[photoIdx]) {
					ctx.drawImage(liveCanvases[photoIdx], 0, 0);
					drawLiveCorners(`liveCanvas-${photoIdx}`, photoIdx);
				}
			}
		};
	};
	*/

	/* deprecated
	const combineLivePhotos = async () => {
		try {
			loading = true;
			// @ts-ignore
			const { PDFDocument } = window.PDFLib;
			const pdfDoc = await PDFDocument.create();

			// Process each photo in ascending order
			for (let photoIdx = 0; photoIdx < liveCanvases.length; photoIdx++) {
				const corners = liveCorners[photoIdx];
				if (!corners.tl || !corners.tr || !corners.br || !corners.bl) {
					toast.error(`Photo ${photoIdx + 1}: Please select all 4 corners`);
					loading = false;
					return;
				}

				const canvas = liveCanvases[photoIdx];
				const src = cv.imread(canvas);

				// Perspective transform
				const srcTri = cv.matFromArray(4, 1, cv.CV_32FC2, [
					corners.tl[0],
					corners.tl[1],
					corners.tr[0],
					corners.tr[1],
					corners.br[0],
					corners.br[1],
					corners.bl[0],
					corners.bl[1],
				]);

				const widthTop = Math.hypot(corners.tr[0] - corners.tl[0], corners.tr[1] - corners.tl[1]);
				const widthBottom = Math.hypot(
					corners.br[0] - corners.bl[0],
					corners.br[1] - corners.bl[1],
				);
				const heightLeft = Math.hypot(corners.bl[0] - corners.tl[0], corners.bl[1] - corners.tl[1]);
				const heightRight = Math.hypot(
					corners.br[0] - corners.tr[0],
					corners.br[1] - corners.tr[1],
				);

				const width = Math.max(widthTop, widthBottom);
				const height = Math.max(heightLeft, heightRight);

				const dstTri = cv.matFromArray(4, 1, cv.CV_32FC2, [
					0,
					0,
					width,
					0,
					width,
					height,
					0,
					height,
				]);

				const M = cv.getPerspectiveTransform(srcTri, dstTri);
				const warped = new cv.Mat();
				cv.warpPerspective(src, warped, M, new cv.Size(width, height));

				// Apply contrast
				const contrast = new cv.Mat();
				cv.convertScaleAbs(warped, contrast, 1.1, 10);

				// Scale to A4
				const availableWidth = A4_WIDTH - A4_MARGIN * 2;
				const availableHeight = A4_HEIGHT - A4_MARGIN * 2;
				const scale = Math.min(availableWidth / width, availableHeight / height);
				const scaledWidth = Math.round(width * scale);
				const scaledHeight = Math.round(height * scale);

				const resized = new cv.Mat();
				cv.resize(contrast, resized, new cv.Size(scaledWidth, scaledHeight));

				// Create A4 canvas
				const a4Canvas = document.createElement("canvas");
				a4Canvas.width = A4_WIDTH;
				a4Canvas.height = A4_HEIGHT;
				const a4Ctx = a4Canvas.getContext("2d");

				if (!a4Ctx) {
					toast.error("Error processing photo");
					loading = false;
					return;
				}

				a4Ctx.fillStyle = "#ffffff";
				a4Ctx.fillRect(0, 0, A4_WIDTH, A4_HEIGHT);

				const offsetX = (A4_WIDTH - scaledWidth) / 2;
				const offsetY = (A4_HEIGHT - scaledHeight) / 2;

				const tempCanvas = document.createElement("canvas");
				tempCanvas.width = scaledWidth;
				tempCanvas.height = scaledHeight;
				cv.imshow(tempCanvas, resized);

				a4Ctx.drawImage(tempCanvas, offsetX, offsetY, scaledWidth, scaledHeight);

				// Add to PDF
				await new Promise<void>((resolve) => {
					a4Canvas.toBlob(
						async (blob) => {
							const arrayBuf = await blob!.arrayBuffer();
							const page = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT]);
							const jpegImage = await pdfDoc.embedJpg(arrayBuf);
							page.drawImage(jpegImage, {
								x: 0,
								y: 0,
								width: A4_WIDTH,
								height: A4_HEIGHT,
							});
							resolve();
						},
						"image/jpeg",
						0.7,
					);
				});

				// Cleanup
				src.delete();
				srcTri.delete();
				dstTri.delete();
				M.delete();
				warped.delete();
				contrast.delete();
				resized.delete();
			}

			// Save and download PDF
			const pdfBytes = await pdfDoc.save();
			const pdfBlob = new Blob([pdfBytes], { type: "application/pdf" });
			const url = URL.createObjectURL(pdfBlob);
			const link = document.createElement("a");
			link.href = url;
			link.download = `kyc-${kycType}-${Date.now()}.pdf`;
			link.click();
			URL.revokeObjectURL(url);

			toast.success("PDF created and downloaded!");
			loading = false;
		} catch (error) {
			toast.error("Error combining photos");
			console.error(error);
			loading = false;
		}
	};
	*/

	/*capturePhoto deprecated
	const capturePhoto = () => {
		if (kycType !== "selfie") {
			capturePhotoMultiple();
			return;
		}

		const c = document.createElement("canvas");

		if (!videoEl) return;

		c.width = videoEl.videoWidth;
		c.height = videoEl.videoHeight;

		const ctx = c.getContext("2d");

		if (!ctx) return;

		// mirror horizontally
		ctx.scale(-1, 1);
		ctx.drawImage(videoEl, -c.width, 0, c.width, c.height);

		c.toBlob(
			(blob) => {
				if (blob) {
					liveBlobs.push(blob);
					liveBlobs = liveBlobs;
					imgSrcs.push(URL.createObjectURL(blob));
					imgSrcs = imgSrcs;
					// toast.info("took a pic!");
					c.remove();
				}
			},
			"image/png",
			0.7,
		);
	};
	*/

	const startCam = async () => {
		kycBegin = true;
		selectedOption = "live";

		await tick();

		if (videoEl) {
			const stream = await navigator.mediaDevices.getUserMedia({
				video: { facingMode: "environment" },
			});

			videoEl.srcObject = stream;
			videoEl.play();
		}
	};

	/* maybe later
	const retakePhotoMultiple = async ({
		addOther,
		index,
	}: {
		index?: number;
		addOther?: boolean;
	}) => {
		if (addOther) {
			startCam();
			return;
		}

		if (index !== undefined) {
			liveBlobs.splice(index, 1);
			liveBlobs = liveBlobs;

			imgSrcs.splice(index, 1);
			imgSrcs = imgSrcs;

			liveCanvases.splice(index, 1);
			liveCanvases = liveCanvases;

			// Rebuild corners object
			const newCorners: typeof liveCorners = {};
			Object.entries(liveCorners).forEach(([key, val]) => {
				const idx = parseInt(key);
				if (idx > index) {
					newCorners[idx - 1] = val;
				} else if (idx < index) {
					newCorners[idx] = val;
				}
			});
			liveCorners = newCorners;
		} else {
			liveBlobs = [];
			imgSrcs = [];
			liveCanvases = [];
			liveCorners = {};
		}

		await tick();
		startCam();
	};
	*/

	const retakePhoto = async ({ addOther, index }: { index?: number; addOther?: boolean }) => {
		if (addOther) {
			startCam();
			return;
		}

		if (index) {
			liveBlobs.splice(index, 1);
			liveBlobs = liveBlobs;

			imgSrcs.splice(index, 1);
			imgSrcs = imgSrcs;
		} else {
			liveBlobs = [];
			imgSrcs = [];
		}

		await tick();

		startCam();
	};

	let livePhotos = $state<
		{
			id: string;
			canvas: HTMLCanvasElement;
			blob: Blob;
			corners: {
				tl: null | [number, number];
				tr: null | [number, number];
				br: null | [number, number];
				bl: null | [number, number];
			};
		}[]
	>([]);

	const captureFromVideo = async () => {
		if (!videoEl) {
			toast.error("Camera not ready");
			return;
		}

		// Create canvas matching VIDEO element's displayed size
		const canvas = document.createElement("canvas");
		canvas.width = videoEl.videoWidth;
		canvas.height = videoEl.videoHeight;

		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		// Draw video frame
		ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);

		// Convert to blob
		return new Promise<Blob>((resolve) => {
			canvas.toBlob(
				(blob) => {
					if (blob) resolve(blob);
				},
				"image/jpeg",
				0.9,
			);
		});
	};

	const capturePhotoTwo = async () => {
		if (kycType === "selfie") {
			const blob = await captureFromVideo();
			if (blob) {
				liveBlobs.push(blob);
				liveBlobs = liveBlobs;
				imgSrcs.push(URL.createObjectURL(blob));
				imgSrcs = imgSrcs;
			}
			return;
		}

		const blob = await captureFromVideo();
		if (!blob) return;

		const img = new Image();
		img.onload = async () => {
			const photoCanvas = document.createElement("canvas");
			photoCanvas.width = img.width;
			photoCanvas.height = img.height;

			const photoCtx = photoCanvas.getContext("2d");
			if (!photoCtx) return;

			photoCtx.drawImage(img, 0, 0);

			const photoId = `photo-${Date.now()}`;
			livePhotos = [
				...livePhotos,
				{
					id: photoId,
					canvas: photoCanvas,
					blob,
					corners: { tl: null, tr: null, br: null, bl: null },
				},
			];

			// NOW draw to the DOM canvas immediately
			await tick();

			const domCanvas = document.getElementById(`canvas-${photoId}`) as HTMLCanvasElement;
			if (domCanvas) {
				const domCtx = domCanvas.getContext("2d");
				if (domCtx) {
					domCtx.drawImage(photoCanvas, 0, 0);
				}
			}
		};

		img.src = URL.createObjectURL(blob);
	};

	const liveCanvasClickHandlerTwo = (photoId: string) => {
		return (e: any) => {
			const canvas = document.getElementById(`canvas-${photoId}`) as HTMLCanvasElement;
			if (!canvas) return;

			const photo = livePhotos.find((p) => p.id === photoId);
			if (!photo) return;

			const rect = canvas.getBoundingClientRect();
			const x = e.clientX - rect.left;
			const y = e.clientY - rect.top;

			const scaleX = canvas.width / rect.width;
			const scaleY = canvas.height / rect.height;
			const actualX = x * scaleX;
			const actualY = y * scaleY;

			const cornerOrder: Array<"tl" | "tr" | "br" | "bl"> = ["tl", "tr", "br", "bl"];
			const currentIdx = Object.values(photo.corners).filter((c) => c !== null).length;

			if (currentIdx < 4) {
				const cornerName = cornerOrder[currentIdx];
				photo.corners[cornerName] = [Math.round(actualX), Math.round(actualY)];
				livePhotos = livePhotos; // Force reactivity

				// Redraw
				const ctx = canvas.getContext("2d");
				if (ctx) {
					ctx.drawImage(photo.canvas, 0, 0);
					drawLiveCornersTwo(canvas, photo.corners);
				}
			}
		};
	};

	const drawLiveCornersTwo = (canvas: HTMLCanvasElement, corners: any) => {
		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		const cornerKeys: Array<"tl" | "tr" | "br" | "bl"> = ["tl", "tr", "br", "bl"];
		const labels = ["TL", "TR", "BR", "BL"];

		cornerKeys.forEach((key, idx) => {
			if (corners[key]) {
				const [x, y] = corners[key];
				ctx.beginPath();
				ctx.arc(x, y, CORNER_RADIUS, 0, 2 * Math.PI);
				ctx.fillStyle = CORNER_COLOR;
				ctx.fill();
				ctx.strokeStyle = "#000";
				ctx.lineWidth = 2;
				ctx.stroke();

				ctx.fillStyle = "#000";
				ctx.font = `bold 12px Arial`;
				ctx.fillText(labels[idx], x + 15, y - 10);
			}
		});

		if (corners.tl && corners.tr && corners.br && corners.bl) {
			ctx.strokeStyle = CORNER_COLOR;
			ctx.lineWidth = 2;
			ctx.setLineDash([5, 5]);
			ctx.beginPath();
			ctx.moveTo(corners.tl[0], corners.tl[1]);
			ctx.lineTo(corners.tr[0], corners.tr[1]);
			ctx.lineTo(corners.br[0], corners.br[1]);
			ctx.lineTo(corners.bl[0], corners.bl[1]);
			ctx.closePath();
			ctx.stroke();
			ctx.setLineDash([]);
		}
	};

	const combineLivePhotosTwo = async () => {
		try {
			loading = true;
			// @ts-ignore
			const { PDFDocument } = window.PDFLib;
			const pdfDoc = await PDFDocument.create();

			// Process each photo
			for (const photo of livePhotos) {
				const corners = photo.corners;
				if (!corners.tl || !corners.tr || !corners.br || !corners.bl) {
					toast.error(`Photo: Please select all 4 corners`);
					loading = false;
					return;
				}

				const canvas = photo.canvas;
				const src = cv.imread(canvas);

				// Perspective transform
				const srcTri = cv.matFromArray(4, 1, cv.CV_32FC2, [
					corners.tl[0],
					corners.tl[1],
					corners.tr[0],
					corners.tr[1],
					corners.br[0],
					corners.br[1],
					corners.bl[0],
					corners.bl[1],
				]);

				const widthTop = Math.hypot(corners.tr[0] - corners.tl[0], corners.tr[1] - corners.tl[1]);
				const widthBottom = Math.hypot(
					corners.br[0] - corners.bl[0],
					corners.br[1] - corners.bl[1],
				);
				const heightLeft = Math.hypot(corners.bl[0] - corners.tl[0], corners.bl[1] - corners.tl[1]);
				const heightRight = Math.hypot(
					corners.br[0] - corners.tr[0],
					corners.br[1] - corners.tr[1],
				);

				const width = Math.max(widthTop, widthBottom);
				const height = Math.max(heightLeft, heightRight);

				const dstTri = cv.matFromArray(4, 1, cv.CV_32FC2, [
					0,
					0,
					width,
					0,
					width,
					height,
					0,
					height,
				]);

				const M = cv.getPerspectiveTransform(srcTri, dstTri);
				const warped = new cv.Mat();
				cv.warpPerspective(src, warped, M, new cv.Size(width, height));

				// Apply contrast
				const contrast = new cv.Mat();
				cv.convertScaleAbs(warped, contrast, 1.1, 10);

				// Scale to A4
				const availableWidth = A4_WIDTH - A4_MARGIN * 2;
				const availableHeight = A4_HEIGHT - A4_MARGIN * 2;
				const scale = Math.min(availableWidth / width, availableHeight / height);
				const scaledWidth = Math.round(width * scale);
				const scaledHeight = Math.round(height * scale);

				const resized = new cv.Mat();
				cv.resize(contrast, resized, new cv.Size(scaledWidth, scaledHeight));

				// Create A4 canvas
				const a4Canvas = document.createElement("canvas");
				a4Canvas.width = A4_WIDTH;
				a4Canvas.height = A4_HEIGHT;
				const a4Ctx = a4Canvas.getContext("2d");

				if (!a4Ctx) {
					toast.error("Error processing photo");
					loading = false;
					return;
				}

				a4Ctx.fillStyle = "#ffffff";
				a4Ctx.fillRect(0, 0, A4_WIDTH, A4_HEIGHT);

				const offsetX = (A4_WIDTH - scaledWidth) / 2;
				const offsetY = (A4_HEIGHT - scaledHeight) / 2;

				const tempCanvas = document.createElement("canvas");
				tempCanvas.width = scaledWidth;
				tempCanvas.height = scaledHeight;
				cv.imshow(tempCanvas, resized);

				a4Ctx.drawImage(tempCanvas, offsetX, offsetY, scaledWidth, scaledHeight);

				// Add to PDF
				await new Promise<void>((resolve) => {
					a4Canvas.toBlob(
						async (blob) => {
							const arrayBuf = await blob!.arrayBuffer();
							const page = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT]);
							const jpegImage = await pdfDoc.embedJpg(arrayBuf);
							page.drawImage(jpegImage, {
								x: 0,
								y: 0,
								width: A4_WIDTH,
								height: A4_HEIGHT,
							});
							resolve();
						},
						"image/jpeg",
						0.7,
					);
				});

				// Cleanup
				src.delete();
				srcTri.delete();
				dstTri.delete();
				M.delete();
				warped.delete();
				contrast.delete();
				resized.delete();
			}

			// Save and download PDF
			const pdfBytes = await pdfDoc.save();
			const pdfBlob = new Blob([pdfBytes], { type: "application/pdf" });
			const url = URL.createObjectURL(pdfBlob);
			const link = document.createElement("a");
			link.href = url;
			link.download = `kyc-${kycType}-${Date.now()}.pdf`;
			link.click();
			URL.revokeObjectURL(url);

			toast.success("PDF created and downloaded!");
			loading = false;
		} catch (error) {
			toast.error("Error combining photos");
			console.error(error);
			loading = false;
		}
	};
</script>

<svelte:head>
	<script
		async
		src="https://docs.opencv.org/4.5.1/opencv.js"
		onload={() => onOpenCvReady()}
	></script>
	<script src="https://cdn.jsdelivr.net/npm/pdf-lib/dist/pdf-lib.min.js"></script>
</svelte:head>

<div class="tainer">
	{#if !cvReady}
		<section class="scanify loading hfit"></section>
	{:else}
		<section class="scanify hfit">
			<h4 class="mb-4">
				{#if selectedOption === "live"}
					<Button variant="ghost" onclick={() => reset({ toMain: true })}
						><MoveLeft class="h-4 w-4" />{#if kycType === "selfie"}
							Take a Selfie!
						{:else}
							Scan and Upload!
						{/if}</Button
					>
				{:else if selectedFile}
					<Button variant="ghost" onclick={() => reset({ toMain: true })}
						><MoveLeft class="h-4 w-4" />Go Back</Button
					>
				{:else}
					Choose an Option
				{/if}
			</h4>

			{#if selectedOption === "none"}
				<Label class="mb-3"><b>KYC Type</b></Label>
				<div class="mb-5">
					<AnyPicker
						data={[
							{ label: "Proof of Address", value: "poa" },
							{ label: "Proof of Identity", value: "poi" },
							{ label: "Account Opening Document", value: "aco" },
							{ label: "Selfie", value: "selfie" },
						]}
						handler={(val) => (kycType = val)}
						pickerTitle="Document Type"
						value={kycType}
					/>
				</div>

				<Label class="mb-3"><b>Upload Method</b></Label>
				<div
					class={isMobile
						? "flex flex-col items-center pb-2"
						: "flex w-full flex-row justify-center pb-2"}
				>
					<Button variant="outline" onclick={() => startCam()}
						>Live Photo<Cctv class="h-4 w-4" /></Button
					>
					<Button
						class={isMobile ? "my-2" : "mx-2"}
						variant="outline"
						onclick={() => initPhotoUpload()}>Upload Photo<Images class="h-4 w-4" /></Button
					>
					<input
						id="image-input"
						class="fileInput"
						type="file"
						accept="image/*"
						onchange={handlePhotoUpload}
					/>
					<Button variant="outline" onclick={() => initPdfUpload()}
						>Upload PDF<Upload class="h-4 w-4" /></Button
					>
					<input
						id="pdf-input"
						class="fileInput"
						type="file"
						accept="application/pdf"
						onchange={handlePdfUpload}
					/>
				</div>
			{:else if selectedOption === "upload"}
				<canvas id="originalCanvas" onclick={canvasClickHandler}></canvas>
				<p class="text-justify text-sm text-muted-foreground">
					Click the four corners of your scan in the following order: Top Left, Top Right, Bottom
					Right, Bottom Left
				</p>

				<div class="mt-5 flex flex-row justify-center">
					<Button
						variant="outline"
						class="mr-2"
						onclick={() => reset({ keepFile: true, redrawCanvas: true })}
						disabled={previewReady}>Reset Corners<RotateCcw class="h-4 w-4" /></Button
					>
					<Button
						disabled={previewReady ? previewReady : currentCornerIndex !== 4}
						onclick={() => previewScan()}
						variant="outline"
						class="ml-2">Preview<Rows2 class="h-4 w-4" /></Button
					>
				</div>

				{#if previewReady}
					<canvas class="mt-8" id="previewCanvas"></canvas>
					<div class="mt-5 flex flex-row justify-center">
						<Button variant="outline" class="mr-2" onclick={() => (previewReady = false)}
							>Retry<RotateCcw class="h-4 w-4" /></Button
						>
						<Button disabled={loading} variant="outline" class="ml-2"
							>Upload{#if loading}<Spinner />{:else}<Upload class="h-4 w-4" />{/if}</Button
						>
					</div>
				{/if}
			{:else if selectedOption === "pdf"}
				<iframe src={`${pdfSrc}#toolbar=0`} title="pdf preview" class="pdfPreview"></iframe>
				<Button disabled={loading} variant="outline" class="mt-5"
					>Upload{#if loading}<Spinner />{:else}<Upload class="h-4 w-4" />{/if}</Button
				>
			{:else if selectedOption === "live"}
				<Label>What To Do</Label>
				<p class="text-justify text-sm text-muted-foreground">
					1. Ensure that the camera is clean with no glare.
				</p>
				<p class="text-justify text-sm text-muted-foreground">
					2. Make sure to take the photo on a plain background.
				</p>
				<p class="text-justify text-sm text-muted-foreground">
					3. Take the photo when your face or document is in the white box.
				</p>

				<div class="selfie-tainer">
					<video bind:this={videoEl} class="selfie-cam mt-4" autoplay playsinline muted>
						<track kind="captions" />
					</video>

					<div class="focus-tainer">
						{#if kycType !== "selfie"}
							<div class="page"></div>
						{:else}
							<div class="page selfie"></div>
						{/if}
					</div>
				</div>

				<p class="mt-3 text-justify text-sm text-muted-foreground">
					<b>Tip:</b> Press the button below to take the photo.
				</p>

				<button
					disabled={kycType === "selfie" && imgSrcs.length === 1}
					class="selfie-button"
					onclick={capturePhotoTwo}
				>
					<Circle class="h-[35px] w-[35px]" />
				</button>

				{#if imgSrcs.length && kycType === "selfie"}
					{#each imgSrcs as imgSrc, index}
						<Label class="mt-5 mb-3">Angle Good Enough?</Label>
						<img class="photo-id-taken" src={imgSrc} alt="foto-id" />
						<div class="mt-5 flex flex-row justify-center">
							<Button class="mt-5" variant="destructive" onclick={() => retakePhoto({})}
								>Retake<RotateCcw class="ml-2 h-4 w-4" /></Button
							>
							<Button class="mt-5" variant="destructive" onclick={() => retakePhoto({})}
								>Upload<Upload class="ml-2 h-4 w-4" /></Button
							>
						</div>
					{/each}
				{/if}

				<!-- old live canvases
				{#each liveCanvases as _, photoIdx}
					<Label class="mt-5 mb-3"
						>Page: <span class="num">{photoIdx + 1}</span> - Select Corners</Label
					>
					<canvas
						id={`liveCanvas-${photoIdx}`}
						class="canvasGeneric"
						onclick={liveCanvasClickHandler(photoIdx)}
					></canvas>
					<p class="text-justify text-sm text-muted-foreground">
						Corners selected: {Object.values(liveCorners[photoIdx] || {}).filter((c) => c !== null)
							.length}/4
					</p>
				{/each}
				-->

				{#each livePhotos as photo (photo.id)}
					<Label class="mt-5 mb-3"
						>Page: <span class="num">{livePhotos.indexOf(photo) + 1}</span> - Select Corners</Label
					>
					<canvas
						id={`canvas-${photo.id}`}
						width={photo.canvas.width || 0}
						height={photo.canvas.height || 0}
						class="liveCanvasPreview"
						onclick={liveCanvasClickHandlerTwo(photo.id)}
					></canvas>
					<p class="text-justify text-sm text-muted-foreground">
						Corners selected: {Object.values(photo.corners).filter((c) => c !== null).length}/4
					</p>
				{/each}
				{#if livePhotos.length}
					<div class="mt-5 flex flex-row flex-wrap justify-center gap-2">
						<Button
							disabled={loading
								? loading
								: !Object.values(livePhotos).every(
										(c) => c.corners.tl && c.corners.tr && c.corners.br && c.corners.bl,
									)}
							variant="outline"
							onclick={() => combineLivePhotosTwo()}
						>
							{#if loading}
								Combine PDF<Spinner />
							{:else}
								Combine PDF<Upload class="h-4 w-4" />
							{/if}
						</Button>
					</div>
				{/if}
			{/if}
		</section>
	{/if}
</div>
<p class="-mt-3 w-full text-center text-[10pt] opacity-50">
	Powered by <a href="https://www.cerebrus.dev/scanify" target="_blank" rel="noopener"
		><i>Signify</i></a
	>
</p>

<style lang="scss">
	.tainer {
		width: 100%;
		padding: 20px 2%;
		display: flex;
		flex-direction: column;
		align-items: center;

		.scanify {
			width: 100%;
			max-width: 420px;
			border: 1px solid rgb(69, 225, 220);
			border-radius: var(--radius);
			display: inherit;
			flex-direction: inherit;
			align-items: inherit;
			padding: 10px 10px;
			box-sizing: content-box;

			&.loading {
				border: 1px solid transparent;
				height: 200px !important;
			}

			&.hfit {
				height: fit-content;
			}

			/*
			&.ratiod {
				aspect-ratio: 0.7069555302166477;
			}
            */

			.fileInput {
				display: none;
			}

			#originalCanvas {
				max-width: 100%;
				height: auto;
				border: 2px solid #999;
				cursor: crosshair;
				display: none;
			}

			.canvasGeneric {
				max-width: 100%;
				border: 2px solid #999;
				cursor: crosshair;
				display: block;
				height: auto;
			}

			.liveCanvasPreview {
				max-width: 100%;
				height: auto;
				border: 2px solid #999;
				cursor: crosshair;
				display: block;
			}

			#previewCanvas {
				max-width: 100%;
				height: auto;
				border: 2px solid #999;
				display: none;
			}

			.pdfPreview {
				width: 100%;
				aspect-ratio: 0.7069555302166477;
			}

			.selfie-tainer {
				position: relative;
				width: 100%;
				height: fit-content;
			}

			.photo-id-taken {
				border-radius: var(--radius);
				box-shadow: 0px 0px 3px var(--shadow);
			}

			.focus-tainer {
				position: absolute;
				//border: 1px solid red;
				z-index: 1;
				color: #f7f7f7;
				top: 50%;
				left: 50%;
				transform: translateX(-50%) translateY(-50%);
				opacity: 0.7;

				.page {
					width: 350px;
					border: 5px dashed white;
					aspect-ratio: 0.7069555302166477;
					margin-top: 14px;

					@media screen and (max-width: 768px) {
						width: 260px;
						margin-top: 20px;
					}

					&.selfie {
						aspect-ratio: 0.7;
						margin: 0px;
						padding: 100px;
						width: 140px;
					}
				}
			}

			.selfie-cam {
				transform: scaleX(-1);
				border-radius: var(--radius);
				box-shadow: 0px 0px 3px var(--shadow);
				aspect-ratio: 0.78;
				width: fit-content;
				object-fit: cover;

				@media screen and (max-width: 768px) {
					transform: scaleX(1);
				}
			}

			.selfie-button {
				background-color: var(--secondary);
				margin: 0px auto;
				border-radius: 50%;
				height: 50px;
				width: 50px;
				box-shadow: 0px 0px 3px var(--shadow);
				display: flex;
				align-items: center;
				justify-content: center;

				&:active {
					transform: scale(0.9);
				}
			}
		}
	}
</style>
