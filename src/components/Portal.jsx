import {
  	CameraControls,
	CameraControlsImpl,
	Environment,
  	MeshPortalMaterial,
  	RoundedBox,
  	Text,
  	useCursor,
  	useTexture,
} from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { easing } from 'maath'
import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import ExitPortal from './portal/ExitPortal'

const Portal = ({ name, texture, active, handleActivePortal, handleCurrentBook, levelStart, levelStarted, BooksDisplay, books, booksSolved, chapterFinished }) => {
  	const { ACTION } = CameraControlsImpl
  	const [hovered, setHovered] = useState(null)
  	useCursor(hovered)
  	const controlsRef = useRef()
  	const scene = useThree((state) => state.scene)

	const map = useTexture(texture)
  	const portalMaterial = useRef()

  	useFrame((_state, delta) => {
    	const worldOpen = active === name
    	easing.damp(portalMaterial.current, 'blend', worldOpen ? 1 : 0, 0.15, delta)
  	})

  	useEffect(() => {
    	if (active) {
      		const targetPosition = new THREE.Vector3()
      		scene.getObjectByName(active).getWorldPosition(targetPosition)
      		controlsRef.current.setLookAt(
        		0,
        		0,
        		3,
        		targetPosition.x,
        		targetPosition.y,
        		targetPosition.z,
        		true
      		)
    	} else {
      		controlsRef.current.setLookAt(0, 0, 10, 0, 0, 0, true)
    	}
  	}, [active])

  	return (
    	<>
      		<ambientLight intensity={0.5} />
      		<CameraControls 
        		ref={controlsRef}
        		maxPolarAngle={Math.PI / 2}
        		minPolarAngle={Math.PI / 2}
				mouseButtons={{
					left: ACTION.ROTATE,
					middle: ACTION.NONE,
					right: ACTION.ROTATE,
					wheel: ACTION.NONE,
				}}
				touches={{
					one: ACTION.TOUCH_ROTATE,
					two: ACTION.TOUCH_ROTATE,
					three: ACTION.TOUCH_ROTATE,
				}}
      		/>
			{active && !levelStart && <ExitPortal name={name} handleActivePortal={handleActivePortal} />}
			{active && !levelStart && <BooksDisplay handleCurrentBook={handleCurrentBook} levelStarted={levelStarted} books={books} booksSolved={booksSolved} />}
      			<Text
        			font='fonts/CabinSketch-Regular.ttf'
        			fontSize={0.3}
					color={'white'}
					outlineColor={'black'}
					outlineWidth={0.0175}
        			position={[0, -1.3, 0.051]}
        			anchorY={'bottom'}
      			>		
        			{name}
        			<meshBasicMaterial color={'white'} toneMapped={false} />
      			</Text>

      			<RoundedBox
        			name={name}
        			args={[2, 3.25, 0.1]}
        			onClick={() => {
						if (!active) {
							handleActivePortal(name)
						}
					}}
        			onPointerEnter={() =>{
						if (!active) {
							setHovered(name)
						}
					}}
        			onPointerLeave={() => setHovered(null)}
      			>
        			<MeshPortalMaterial ref={portalMaterial} side={THREE.DoubleSide}>
          				<ambientLight intensity={1} />
						<Environment preset='sunset' />
          					<mesh>
            					<sphereGeometry args={[4.5, 64, 64]} />
            					<meshStandardMaterial map={map} side={THREE.BackSide} />
          					</mesh>
        			</MeshPortalMaterial>
        		</RoundedBox>
    		</>
  	)
}

export default Portal