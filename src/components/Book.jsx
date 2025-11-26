import { useCursor, useTexture } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useAtom, atom } from 'jotai'
import { easing } from 'maath'
import { useState, useEffect, useRef, useMemo } from 'react'
import {
  	Bone,
  	BoxGeometry,
  	Color,
  	Float32BufferAttribute,
  	MathUtils,
  	MeshStandardMaterial,
  	Skeleton,
  	SkinnedMesh,
  	SRGBColorSpace,
  	Uint16BufferAttribute,
  	Vector3,
} from 'three'
import { degToRad } from 'three/src/math/MathUtils.js'

const pageAtom = atom(0)

 // Controls the speed of easing.
const easingFactor = 0.5

 // Controls the speed of fold easing.
const easingFactorFold = 0.3

 // Controls the strength of the inside curve.
const insideCurveStrength = 0.18

 // Controls the strength of the outside curve.
const outsideCurveStrength = 0.05

 // Controls the strength of the turning curve.
const turningCurveStrength = 0.09


// Create a constant value that defines the box geometry.
const PAGE_WIDTH = 1.28
const PAGE_HEIGHT = 1.71
const PAGE_DEPTH = 0.003
const PAGE_SEGMENTS = 30
const SEGMENT_WIDTH = PAGE_WIDTH / PAGE_SEGMENTS

// Create a page geometry object.
const pageGeometry = new BoxGeometry(
  	PAGE_WIDTH,
  	PAGE_HEIGHT,
  	PAGE_DEPTH,
  	PAGE_SEGMENTS,
  	2
)

// Position the geometry to left.
pageGeometry.translate(PAGE_WIDTH / 2, 0, 0)


// Get all the positions for the geometry.
const position = pageGeometry.attributes.position

// Creat a vertex object.
const vertex = new Vector3()

// Skin indexes are the index of the bones.
const skinIndexes = []

// Skin weights are the impact of the bones.
const skinWeights = []

// Loop through all vertices
for (let i = 0; i < position.count; i++) {
  	// Get the vertex.
  	vertex.fromBufferAttribute(position, i)

  	// Get the x-position of the vertex.
  	const x = vertex.x

  	// Calculate the skin index to know which bone will be affected by
  	// dividing the current position of x by the segment width.
  	const skinIndex = Math.max(0, Math.floor(x / SEGMENT_WIDTH))

  	// Calculate the skin weight.
  	let skinWeight = (x % SEGMENT_WIDTH) / SEGMENT_WIDTH

  	// Set the skin indexes and skin weights by pushing four values.
	// The first value is the first bone that has an impact on the vertex.
	// The second value is the second bone that has an impact on the vertex.
	// No value is used to the third and fourth values
	// as only two bones are used per vertex.
	skinIndexes.push(skinIndex, skinIndex + 1, 0, 0)
	skinWeights.push(1 - skinWeight, skinWeight, 0, 0)
}

// Attach the attribute to the geometry.
// For the skin index, a Uint16 Buffer Attribute is created and
// 4 bones are put that will have an impact on the vertices.
pageGeometry.setAttribute(
	"skinIndex",
	new Uint16BufferAttribute(skinIndexes, 4)
)
// For the skin weight, a Float32 Buffer Attribute is created and
// 4 bones are put that will have an impact on the vertices.
pageGeometry.setAttribute(
	"skinWeight",
	new Float32BufferAttribute(skinWeights, 4)
)

const whiteColor = new Color("white")
const emissiveColor = new Color("orange")

// Create a page materials array containing materials
// that corresponds to each face of the mesh.
// Two materials can be added for the front face and back face.
const pageMaterials = [
	new MeshStandardMaterial({
		color: whiteColor,
	}),
	new MeshStandardMaterial({
		color: "#111",
	}),
	new MeshStandardMaterial({
		color: whiteColor,
	}),
	new MeshStandardMaterial({
		color: whiteColor,
	})
]

const Page = ({ number, front, back, pages, page, opened, bookClosed, musicMuted, ...props }) => {

	/* Declare the texture for the front and back values. 
	   The variables picture is the front texture, picture2 is the back texture
	   and pictureRoughness is the page texture for the first and last page.	*/
	const [picture, picture2, pictureRoughness] = useTexture([
		`/textures/${front}.jpg`,
		`/textures/${back}.jpg`,
		...(number === 0 || number === pages.length - 1
		? [`/textures/book-cover-roughness.jpg`]
		: []),
	])

	// Change color space that is being used to SRGB.
	picture.colorSpace = picture2.colorSpace = SRGBColorSpace
	const group = useRef()

	// Reference for the date when the paged is opened.
	const turnedAt = useRef(0)

	// Reference for the last frame it was opened.
	const lastOpened = useRef(opened)

	// Create a reference to the skinned mesh.
	const skinnedMeshRef = useRef()

	// Create a skin mesh that is not shared between all the pages.
	// Each page have its own bone and animation.
	// The skin mesh is created inside a useMemo.
  	const manualSkinnedMesh = useMemo(() => {
		// Create a bones array
		const bones = []

			// There are as many bones as there are segments on the page.
			for (let i = 0; i <= PAGE_SEGMENTS; i++) {

				// Create a new bone for each segment. 
				let bone = new Bone()

				// Push it to the bones array.
				bones.push(bone)

				// The first segment have the position of the bone in the x-axis is 0.
				// The rest have their position equal to the segment's width
				// to offset it with the size of the segment.
				if (i === 0) {
					bone.position.x = 0
				} else {
					bone.position.x = SEGMENT_WIDTH
				}

				// If it's not the first bone, attach the new bone to the previous bone
				if (i > 0) {
					bones[i - 1].add(bone)
				}
			}

			// Create a skeleton that contains the bones array.
    		const skeleton = new Skeleton(bones)
		
		// Create materials array containing the four materials in page materials array
		// and a material for the front face and back face.
		const materials = [
			...pageMaterials,

			/*	Material for the front face.
				The color is white and it is mapped with an image.
				If the number is 0, roughness map is set to create
				a visual effect with the light or else the roughness
				is set to achieve a glossy effect.    */
			new MeshStandardMaterial({
				color: whiteColor,
				map: picture,
				...(number === 0
					? {
						roughnessMap: pictureRoughness,
					}
					: {
						roughness: 0.1,
					}),
			emissive: emissiveColor,
			emissiveIntensity: 0,
			}),

			/*	Material for the back face.
				The color is white and it is mapped with an image.
				If it is the last page, roughness map is set to create
				a visual effect with the light or else the roughness
				is set to achieve a glossy effect.    */
      		new MeshStandardMaterial({
        		color: whiteColor,
        		map: picture2,
        		...(number === pages.length - 1
          			? {
              		roughnessMap: pictureRoughness,
            		}
          			: {
              			roughness: 0.1,
            		}),
        	emissive: emissiveColor,
        	emissiveIntensity: 0,
      		}),
    	]


		// Create the skin mesh.
    	const mesh = new SkinnedMesh(pageGeometry, materials)

		// The mesh casts a shadow.
    	mesh.castShadow = true

		// The mest receives a shadow.
    	mesh.receiveShadow = true

		// The book will still be visible even if it is close and bent.
    	mesh.frustumCulled = false

		// Add the root bone to the mesh.
    	mesh.add(skeleton.bones[0])

		// Bind the skeleton to the mesh
    	mesh.bind(skeleton)

    	return mesh
  	}, [])


  	useFrame((_, delta) => {
		// Check if there are current value for the skinned mesh reference
    	if (!skinnedMeshRef.current) {
      		return
    	}

		// Highlighting effect on a page.
    	const emissiveIntensity = highlighted ? 0.22 : 0
    	skinnedMeshRef.current.material[4].emissiveIntensity =
      		skinnedMeshRef.current.material[5].emissiveIntensity = MathUtils.lerp(
        		skinnedMeshRef.current.material[4].emissiveIntensity,
        		emissiveIntensity,
        		0.1
      		)
		
		/* Assign the value of opened to last opened if the value
			of last opened is different than opened */
    	if (lastOpened.current !== opened) {
      		turnedAt.current = +new Date()
      		lastOpened.current = opened
    	}

		// The starting and ending transition effect lasts for 0.4 seconds.
    	let turningTime = Math.min(400, new Date() - turnedAt.current) / 400
    	turningTime = Math.sin(turningTime * Math.PI)

		// If the pages are open, it will face the user.
    	let targetRotation = opened ? -Math.PI / 2 : Math.PI / 2
    	if (!bookClosed) {
      		targetRotation += degToRad(number * 0.8)
    	}

		// Access the bones using skinned mesh reference.
    	const bones = skinnedMeshRef.current.skeleton.bones

		/*	Loop through all the bone and apply a rotation
			to each of the bone to create the curving effect
			when flipping the page.*/
    	for (let i = 0; i < bones.length; i++) {
      		const target = i === 0 ? group.current : bones[i]

      		const insideCurveIntensity = i < 8 ? Math.sin(i * 0.2 + 0.25) : 0
      		const outsideCurveIntensity = i >= 8 ? Math.cos(i * 0.3 + 0.09) : 0
      		const turningIntensity = Math.sin(i * Math.PI * (1 / bones.length)) * turningTime
      		let rotationAngle =
        	insideCurveStrength * insideCurveIntensity * targetRotation -
        	outsideCurveStrength * outsideCurveIntensity * targetRotation +
        	turningCurveStrength * turningIntensity * targetRotation
      		let foldRotationAngle = degToRad(Math.sign(targetRotation) * 2)

			//	If the book was closed, all the pages fold straight
      		if (bookClosed) {
        		if (i === 0) {
          			rotationAngle = targetRotation
          			foldRotationAngle = 0
        		} else {
          			rotationAngle = 0
          			foldRotationAngle = 0
        		}
      		}

			// Smoother transition between pages.
      		easing.dampAngle(
        	target.rotation,
        	"y",
        	rotationAngle,
        	easingFactor,
        	delta
      		)

			// Set the natural folding effect when turning the page.
      		const foldIntensity =
        		i > 8
          			? Math.sin(i * Math.PI * (1 / bones.length) - 0.5) * turningTime
          			: 0
      		easing.dampAngle(
				target.rotation,
				"x",
				foldRotationAngle * foldIntensity,
				easingFactorFold,
				delta
      		)
    	}
	})

  	const [_, setPage] = useAtom(pageAtom)
  	const [highlighted, setHighlighted] = useState(false)
  	useCursor(highlighted)

  	return (
    	<group
			{...props}
			ref={group}

			// When cursor enters the page, propagation is stopped and the page is higlighted.
			onPointerEnter={(e) => {
				e.stopPropagation()
				setHighlighted(true)
			}}

			// When cursor leaves the page, propagation is stopped and the page is unhiglighted.
			onPointerLeave={(e) => {
				e.stopPropagation()
				setHighlighted(false)
			}}

			// When the page is clicked, propagation is stopped and page is changed.
			onClick={(e) => {
				e.stopPropagation()
				setPage(opened ? number : number + 1)
				setHighlighted(false)

				// Create an audio object for the page flip sound effect
				if (!musicMuted) {
					const pageflip = new Audio('/src/assets/audios/page_flip.mp3')
					pageflip.play()
				}
			}}
    	>
      		<primitive
			// Renders each page, adjusting the position of the page in z-axis.
        	object={manualSkinnedMesh}
        	ref={skinnedMeshRef}
        	position-z={-number * PAGE_DEPTH + page * PAGE_DEPTH}
      		/>
    	</group>
  	)
}

const Book = ({ pictures, cover, back, musicMuted, ...props }) => {
  	const [page, setPage] = useAtom(pageAtom)
  	const [delayedPage, setDelayedPage] = useState(page)

	const pages = [
		{
			front: cover,
			back: pictures[0],
		},
	]

	for (let i = 1; i < pictures.length - 1; i += 2) {
		pages.push({
			front: pictures[i % pictures.length],
			back: pictures[(i + 1) % pictures.length],
		})
	}

	pages.push({
		front: pictures[pictures.length - 1],
		back: back,
	})

	// Pre-load each texture that is used.
	pages.forEach((page) => {
		useTexture.preload(`/textures/${page.front}.jpg`)
		useTexture.preload(`/textures/${page.back}.jpg`)
		useTexture.preload(`/textures/book-cover-roughness.jpg`)
	})

	/* Delay the turning of page based on the current page
	   and the difference to the last page that was opened. */
  	useEffect(() => {
    	let timeout
    	const goToPage = () => {
      		setDelayedPage((delayedPage) => {
        		if (page === delayedPage) {
          			return delayedPage
        		} else {
          			timeout = setTimeout(
            			() => { 
							goToPage()
            			},
            		Math.abs(page - delayedPage) > 2 ? 50 : 150
          			)
          			if (page > delayedPage) {
            			return delayedPage + 1
          			}
          			if (page < delayedPage) {
            			return delayedPage - 1
          			}
        		}
      		})
    	}

    	goToPage()
    	return () => {
      		clearTimeout(timeout)
    	}
		
	}, [page])

  	return (
		// Render each pages of the book, its position is rotated facing the user.
    	<group {...props} rotation-y={-Math.PI / 2}>
      		{[...pages].map((pageData, index) => (
        		<Page
          			key={index}
					pages={pages}
          			page={delayedPage}
          			number={index}
          			opened={delayedPage > index}
          			bookClosed={delayedPage === 0 || delayedPage === pages.length}
          			{...pageData}
					musicMuted={musicMuted}
        		/>
      		))}
    	</group>
  	)
}

export default Book