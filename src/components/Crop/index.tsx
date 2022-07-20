import React, { Component, createRef, ReactFragment, useEffect, useRef, useState } from "react";
import './style.scss'
import { Upload, Flip, RotateLeft, RotateRight, ZoomIn, ZoomOut } from './Icons'
// import kofee from '../../assets/1f600.png'

const imgFetch = (url: string) => new Promise((resolve: (a: HTMLImageElement) => any, reject) => {
    let img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject();
    img.src = url;
});

const limit = (input: number, range: { min: number, max: number }) => {
    return Math.min(range.max, Math.max(range.min, input))
}

class toClass<T>{
    to = (a: any) => {
        return a as unknown as T
    }
}

const toDivList = new toClass<HTMLDivElement[]>()

export class Crop extends React.Component<{ image?: string }, { image: string }> {
    image = createRef<HTMLDivElement>();
    view = createRef<HTMLDivElement>();
    viewIMG = createRef<HTMLImageElement>();
    ref = createRef<HTMLDivElement>();
    translated = { x: 0, y: 0 }
    viewdim = { w: 320, h: 320 }
    rotated = 0
    rotated_added = 0
    zoomed = 0
    flip = false
    lastPos = { x: 0, y: 0 }
    zoomdim = { w: 0, h: 0 }
    img?: HTMLImageElement
    canvas = document.createElement('canvas')

    constructor(props: any) {
        super(props)
        this.state = { ...props }
    }

    componentDidMount = async () => {
        this.setState({ image: this.props.image ? this.props.image : '' })
        this.canvas.width = 320;
        this.canvas.height = 320
        const image = this.image.current
        const ref = this.ref.current
        if (!image || !ref) return;
        window.addEventListener('resize', this.resize)
        document.addEventListener('mouseup', this.onMouseUp)
        document.addEventListener('touchend', this.onMouseUp)
        if (this.state.image) {
            const img = await imgFetch(this.state.image)
            this.img = img
            this.resize()
            this.zoom()
        }
    }

    componentDidUpdate = async () => {
        if (this.state.image) {
            const img = await imgFetch(this.state.image)
            this.img = img
            this.resize()
            this.zoom()
        }
    }

    componentWillUnmount() {
        window.removeEventListener('resize', this.resize)
        document.removeEventListener('mouseup', this.onMouseUp)
        document.removeEventListener('touchend', this.onMouseUp)
    }

    reset = () => {
        this.translated = { x: 0, y: 0 }
        this.viewdim = { w: 320, h: 320 }
        this.rotated = 0
        this.rotated_added = 0
        this.zoomed = 0
        this.flip = false
        this.lastPos = { x: 0, y: 0 }
        this.zoomdim = { w: 0, h: 0 }
        this.setState({image:''})
    }

    resize = () => {
        const image = this.image.current
        const ref = this.ref.current
        const view = this.view.current
        if (!image || !ref || !view) return;
        const width = ref.getBoundingClientRect().width
        const m = (width > 300) ? 80 : 40
        view.style.width = (width - m) + 'px'
        view.style.height = (width - m) + 'px'
        this.viewdim = { w: (width - m), h: (width - m) }
        this.zoom()
    }

    zoom = (value?: number) => {
        value = (value != undefined) ? value : this.zoomed
        this.zoomed = value
        const image = this.image.current
        const ref = this.image.current
        const img = this.img
        if (!image || !ref || !img) return;
        let scale = (this.viewdim.w / img.width)
        let mult = 6
        if (img.width < 128) mult = 0.4
        scale *= value * mult + 1
        this.zoomdim = { w: img.width * scale, h: img.height * scale }
        image.style.width = this.zoomdim.w + 'px'
        image.style.height = this.zoomdim.h + 'px'
        this.translate(0, 0)
    }

    onMouseDown = (e: React.MouseEvent<HTMLDivElement, MouseEvent> | React.TouchEvent<HTMLDivElement>) => {
        const a = 'touches' in e ? e.touches[0] : e;
        this.lastPos = { x: a.clientX, y: a.clientY }
        document.addEventListener('mousemove', this.onMouseMove)
        document.addEventListener('touchmove', this.onMouseMove)
    }

    onMouseUp = () => {
        document.removeEventListener('mousemove', this.onMouseMove)
        document.removeEventListener('touchmove', this.onMouseMove)
    }

    onMouseMove = (e: MouseEvent | TouchEvent) => {
        if (!('touches' in e)) e.preventDefault()
        const a = 'touches' in e ? e.touches[0] : e;
        const delta = { x: a.clientX - this.lastPos.x, y: a.clientY - this.lastPos.y }
        this.lastPos = { x: a.clientX, y: a.clientY }
        this.translate(delta.x, delta.y)
    }

    translate = (deltaX: number, deltaY: number) => {
        const image = this.image.current
        const ref = this.image.current
        const img = this.img
        if (!image || !ref || !img) return;
        const [a, b] = ((Math.round(((this.rotated_added) % 360) / 90) % 2 == 0)) ? [this.zoomdim.w - this.viewdim.w, this.zoomdim.h - this.viewdim.h] : [this.zoomdim.h - this.viewdim.h, this.zoomdim.w - this.viewdim.w]
        this.translated.x = limit(this.translated.x + deltaX, { min: a * -0.5, max: a * 0.5 })
        this.translated.y = limit(this.translated.y + deltaY, { min: b * -0.5, max: b * 0.5 })
        image.style.transform = `translate(${this.translated.x}px,${this.translated.y}px) rotate(${this.rotated}deg) ${this.flip ? 'rotateY(180deg)' : 'rotateY(0deg)'}`
    }

    cut = () => {
        const ctx = this.canvas.getContext('2d')
        this.canvas.width = this.viewdim.w
        this.canvas.height = this.viewdim.h
        if (!ctx || !this.img) return
        ctx.clearRect(0, 0, this.viewdim.w, this.viewdim.h)
        const x = this.viewdim.w / 2
        const y = this.viewdim.h / 2
        const deg = Math.PI / 180 * this.rotated
        ctx.translate(this.translated.x, this.translated.y)
        ctx.translate(x, y)
        ctx.rotate(deg);
        ctx.scale(this.flip ? -1 : 1, 1)
        ctx.drawImage(this.img, -this.zoomdim.w * 0.5, -this.zoomdim.h * 0.5, this.zoomdim.w, this.zoomdim.h)
        ctx.scale(this.flip ? -1 : 1, 1)
        ctx.rotate(-deg);
        ctx.translate(-x, -y)
        ctx.translate(-this.translated.x, -this.translated.y)
    }

    rotate = (deg: number, adding: number, flip: boolean) => {
        const image = this.image.current
        const ref = this.image.current
        const img = this.img
        if (!image || !ref || !img) return;
        if (Math.abs(this.rotated - deg) >= 90) image.classList.add('animate')
        if (this.flip != flip) image.classList.add('animate')
        this.rotated = deg + adding
        this.rotated_added = adding
        this.flip = flip
        this.translate(0, 0)
        setTimeout(() => {
            image.classList.remove('animate')
        }, 100)
    }

    render(): React.ReactNode {
        return (
            <div className="crop@body">
                <div ref={this.ref} className="crop@container">
                    <div className="crop@container.body">
                        <div className="crop@image" ref={this.image} onMouseDown={this.onMouseDown} onTouchStart={this.onMouseDown} style={{ backgroundImage: `url(${this.state.image})`, width: 0, height: 0 }}>
                            <img className="crop@image" ref={this.viewIMG} draggable={false} src={this.state.image} alt="" />
                        </div>
                        <div ref={this.view} className="crop@view"></div>
                    </div>
                    {
                        this.state.image == '' ? (
                            <div className="crop@upload" onClick={() => {
                                const file = document.createElement('input')
                                file.type = 'file'
                                file.accept = '.jpg, .jpeg, .png'
                                file.multiple = false
                                file.click()
                                file.onchange = () => {
                                    const fs = file.files ? file.files[0] : null
                                    if(fs){
                                        this.setState({image:URL.createObjectURL(fs)})
                                    }
                                }
                            }}>
                                <Upload />
                            </div>
                        ) : null
                    }
                </div>
                <Rotate45 onChange={this.rotate} />
                <ZoomRange onChange={this.zoom} />
                <div className="crop@btn.group">
                    <div className="crop@btn white" onClick={()=>{
                        this.reset()
                    }}>Clear</div>
                    <div className="crop@btn" onClick={(e) => {
                        this.cut()
                        const imgB64 = this.canvas.toDataURL()
                        const blob = new Blob([Uint8Array.from(
                            atob(imgB64.slice(imgB64.search(',') + 1)).split('').map(a => a.charCodeAt(0))
                        )], { 'type': 'image/png' })
                        navigator.clipboard.write([
                            new ClipboardItem({
                                'image/png': blob
                            })
                        ]);
                    }}>
                        Copy
                    </div>
                    <div className="crop@btn" onClick={() => {
                        this.cut()
                        const imgB64 = this.canvas.toDataURL()
                        const a = document.createElement('a')
                        a.href = imgB64.replace("image/png", "image/octet-stream");
                        a.download = 'image.png';
                        a.click()
                    }}>
                        Save
                    </div>
                </div>
            </div>
        )
    }
}

class Rotate45 extends Component<{ onChange?: (...a: any) => void }, { select: number }> {
    ref = createRef<HTMLDivElement>()
    container = createRef<HTMLDivElement>()
    left = createRef<HTMLDivElement>()
    range: number[] = []
    lastPos = { x: 0, y: 0 }
    translated = { x: 0, y: 0 }
    addition = 0
    flip = false
    constructor(props: any) {
        super(props)
        this.state = {
            select: 0
        }
        const x = () => [...Array(45).keys()].map(a => a + 1)
        this.range = [...x().reverse().map(a => -a), 0, ...x()]
    }
    componentDidMount() {
        const ref = this.ref.current
        const container = this.container.current
        if (!ref || !container) return;
        document.addEventListener("mouseup", this.onMouseUp)
        document.addEventListener("touchend", this.onMouseUp)
        this.translate(0, 0)
    }
    componentWillUnmount() {
        document.removeEventListener("mouseup", this.onMouseUp)
        document.removeEventListener("touchend", this.onMouseUp)
    }

    onMouseDown = (e: React.MouseEvent<HTMLDivElement, MouseEvent> | React.TouchEvent<HTMLDivElement>) => {
        const a = 'touches' in e ? e.touches[0] : e;
        this.lastPos = { x: a.clientX, y: a.clientY }
        document.addEventListener('mousemove', this.onMouseMove)
        document.addEventListener('touchmove', this.onMouseMove)
    }

    onMouseUp = () => {
        document.removeEventListener('mousemove', this.onMouseMove)
        document.removeEventListener('touchmove', this.onMouseMove)
    }

    onMouseMove = (e: MouseEvent | TouchEvent) => {
        if (!('touches' in e)) e.preventDefault()
        const a = 'touches' in e ? e.touches[0] : e;
        const delta = { x: a.clientX - this.lastPos.x, y: a.clientY - this.lastPos.y }
        this.lastPos = { x: a.clientX, y: a.clientY }
        this.translate(delta.x, delta.y)
    }

    translate = (deltaX: number, deltaY: number) => {
        const container = this.container.current
        const ref = this.ref.current
        if (!container || !ref) return;
        const con_dim = container.getBoundingClientRect();
        this.translated.x = limit(this.translated.x + deltaX, { min: (con_dim.width - 12) * -0.5, max: (con_dim.width - 12) * 0.5 })
        container.style.transform = `translate(${this.translated.x}px,${this.translated.y}px)`
        const items = toDivList.to([...container.children])
        items.forEach(a => {
            const n = Number(a.getAttribute('data-degree'))
            const m = Math.abs(n * 12 + this.translated.x)
            if (m < 24) {
                a.style.height = 22 - 12 * (m / 24) + 'px'
            } else {
                a.style.height = '12px'
            }
        })
        this.update(this.translated.x / ((con_dim.width - 12) * -0.5) * 45)
    }

    update = (deg?: number) => {
        if (deg) this.setState({ select: deg })
        if (this.props.onChange) this.props.onChange(this.state.select, this.addition, this.flip)
        if (this.left.current) {
            const t = this.addition % 360
            const r = Math.ceil((this.addition) / 360)
            this.left.current.style.transform = `rotate(${(t == 0 ? r * 360 : -180 + r * 360) + 'deg'})`
        }
    }

    render(): React.ReactNode {
        return (
            <div ref={this.ref} className="crop@rotate">
                <div className="crop@rotate.select">
                    <div>{Math.round(this.state.select)}°</div>
                </div>
                <div className="crop@rotate.tools">
                    <div onClick={() => { this.addition -= 90; this.update() }}>
                        <div ref={this.left}>
                            <RotateLeft />
                        </div>
                    </div>
                    <div onClick={() => { this.flip = !this.flip; this.update() }}>
                        <Flip />
                    </div>
                </div>
                <div ref={this.container} className="crop@rotate.container" onMouseDown={this.onMouseDown} onTouchStart={this.onMouseDown} >
                    {this.range.map(a => <div key={a} data-text={a % 5 == 0 ? a : ''} data-degree={a} className={`${a % 5 == 0 ? 'highlight' : ''}`}></div>)}
                </div>
            </div>
        )
    }
}

class ZoomRange extends Component<{ onChange?: (value: number) => void }> {
    ref = createRef<HTMLDivElement>();
    thumb = createRef<HTMLDivElement>();
    select = createRef<HTMLDivElement>();
    onMouseDown = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        this.onMouseMove(e as unknown as MouseEvent)
        document.addEventListener("mousemove", this.onMouseMove)
        document.addEventListener("touchmove", this.onMouseMove)
    }
    onMouseMove = (e: MouseEvent | TouchEvent) => {
        if (!('touches' in e)) e.preventDefault()
        const ref = this.ref.current
        const thumb = this.thumb.current
        const select = this.select.current
        if (!ref || !thumb || !select) return;
        const ref_rect = ref.getBoundingClientRect()
        const thumb_rect = thumb.getBoundingClientRect()
        const a = 'touches' in e ? e.touches[0] : e;
        const range = limit(a.clientX - ref_rect.x, { min: 0, max: ref_rect.width })
        thumb.style.left = `${(range - thumb_rect.width / 2) * 100 / ref_rect.width}%`
        select.style.width = (range / ref_rect.width) * 100 + '%'
        if (this.props.onChange) this.props.onChange(range / ref_rect.width)
    }
    onMouseUp = (e: MouseEvent | TouchEvent) => {
        document.removeEventListener("mousemove", this.onMouseMove)
        document.removeEventListener("touchmove", this.onMouseMove)
    }
    componentDidMount = async () => {
        const ref = this.ref.current
        const thumb = this.thumb.current
        const select = this.select.current
        if (!ref || !thumb || !select) return;
        const ref_rect = ref.getBoundingClientRect()
        document.addEventListener("mouseup", this.onMouseUp)
        document.addEventListener("touchend", this.onMouseUp)
        thumb.style.left = `${-(thumb.getBoundingClientRect().width / 2) * 100 / ref_rect.width}%`
    }
    componentWillUnmount() {
        document.removeEventListener("mouseup", this.onMouseUp)
        document.removeEventListener("touchend", this.onMouseUp)
    }
    render(): React.ReactNode {
        return (
            <div className="crop@range">
                <ZoomOut />
                <div ref={this.ref} onMouseDown={(e) => this.onMouseDown(e)} onTouchStart={(e) => this.onMouseDown(e as unknown as React.MouseEvent<HTMLDivElement, MouseEvent>)} className="crop@range.bar">
                    <div className="crop@range.buffer"></div>
                    <div ref={this.select} className="crop@range.select"></div>
                    <div ref={this.thumb} className="crop@range.thumb"></div>
                </div>
                <ZoomIn />
            </div>
        )
    }
}