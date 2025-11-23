import SignIn from '../components/landingpage/SignIn'
import AboutGame from '../components/landingpage/AboutGame'
import EngagingGameplay from '../components/landingpage/EngagingGameplay'
import LandingPage3DPortal from '../components/landingpage/LandingPage3DPortal'
import LandingPageBook from '../components/landingpage/LandingPageBook'
import LandingPageLeaderboards from '../components/landingpage/LandingPageLeaderboards'
import LandingPageAchievements from '../components/landingpage/LandingPageAchievements'
import logo from '../assets/images/hiyasngsalita_tagline-white-outline.png'
import LandingPageMusic from '../assets/audios/landing_page_music.ogg'
import HiyasNgSalitaVideo from '../assets/videos/hiyasngsalita_video.mp4'

import './LandingPage.css'

const LandingPage = ({ musicMuted }) => {

    return (
        <div className='landing_page-container ohp ohv center' id='lpc' style={{ cursor: 'default' }}>
            <audio src={LandingPageMusic} autoPlay loop muted={musicMuted} />
            <div className='landing_page_content-container ohpw center'>
                <div className='landing_page_image-wrapper ohpw center'>
                    <img className='image_logo scale' src={logo} alt='logo' draggable='false' />
                </div> 
                <SignIn />
                <AboutGame />
                <EngagingGameplay />
                <LandingPage3DPortal />
                <LandingPageBook />
                <LandingPageLeaderboards />
                <LandingPageAchievements />

                <div className='landing_page_video-wrapper ohpw center'>
                    <video className='landing_page_video' controls loop={true} muted={musicMuted} >
                        <source src={HiyasNgSalitaVideo} type='video/mp4' />
                    </video>
                </div>

                <div className='landing_page_message-wrapper ohpw center'>
                    <div className='landing_page_message ohpw center'>
                        {`“Ang Kaalaman ay Kayamanan, at ang Karunungan ay Kapangyarihan. Hiyas ng Salita.”`}
                    </div>
                    <div className='landing_page_message_english ohpw center'>
                        {`(Knowledge is treasure, and wisdom is power. Jewel of Words.)`}
                    </div>
                </div>

                <div className='landing_page_copyright'>
                    &#169; COPYRIGHT 2025 HIYAS NG SALITA ALL RIGHTS RESERVED
                </div>
            </div>
        </div>
    )
}

export default LandingPage