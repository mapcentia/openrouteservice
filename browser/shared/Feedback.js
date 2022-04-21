class DHPFeedback extends React.Component{
	constructor(props){
		super(props);

		this.state = {
			open: props.open,
			imageUpload: props.enableImageUpload,
			upload: null,
			selectedFile: null,
			message: "",
			email: '',
			name: '',
			hasError:false,
			feedbackSucces: false,
			postingFeedback: false,
			fileInputRef: null
		}
		this.emailRef = null;
	}

	toggleModal = () => {
		if(this.state.open == null){
			this.setState({open:true});
		}else{
			this.setState({open: !this.state.open})
		}		
	}

	handleTextInput = (event) => {
		this.setState({message: event.target.value});
	}
	
	handleInputName = (event) => {
		this.setState({name: event.target.value});
	}

	handleInputEmail = (event) => {
		this.setState({email: event.target.value});
	}
	
	resetForm = () => {
		let e = {target:{value: ''}};
		this.handleInputEmail(e);
		this.handleInputName(e);
		this.handleTextInput(e);
		this.fileInputRef.value = null;
	}

	submit = (e) => {
		e.preventDefault();

		if(this.emailRef.classList.contains("has-error") || this.emailRef.classList.contains("is-empty")){
			this.setState({hasError:true});
			setTimeout(() => {
				this.setState({hasError:false});
			}, 1000)
			return false;
		}

		this.setState({postingFeedback: true})
		
		let data = {
			email: this.state.email,
			name: this.state.name,
			message: this.state.message,
			file: this.state.selectedFile
		}

		let formData = new FormData();
		
		Object.keys(data).forEach((e) => {
			formData.append([e], data[e])
		})

		// console.log('formdata entries:', formData)

		fetch("/api/feedback", {method:"POST", body:formData}).then(()=> {
			this.setState({feedbackSucces:true});
			this.resetForm();
			
			setTimeout(() => {
				this.setState({postingFeedback: false, feedbackSucces:false});
			}, 2000)
		}).catch((error) => {
			console.error(error);
		});
	}
	
	validateUpload = (e) => {
		if(e.target.files[0].size > 29000000){
			alert("Filen er for stor. Accepterer kun filer under 30 MB storlek");
			$('#inputFile').val(null);
			return false;
		}else{
			this.setState({selectedFile: e.target.files[0]});
			return true;
		}
	}

	render(){
		let submitButtonText = () => {
			if(this.state.hasError){
				return <React.Fragment>Email påkrævet</React.Fragment>;
			}else if(this.state.feedbackSucces){
				return <React.Fragment>Beskeden blev sendt</React.Fragment>
			}else{
				return <React.Fragment>Send besked</React.Fragment>
			}
		}

		let submitButtonStyle = () => {
			if(this.state.feedbackSucces){
				return {background: "green"};
			}else{
				return {};
			}
		}

		let posting = () => {
			if(this.state.postingFeedback){
				return true;
			}else{
				return false;
			}
		}

		return (
			<div className="dhp-fb">

				<div className={this.state.open? 'dhp-fb-modal active': 'dhp-fb-modal'}>
						<form>
							<div className="dhp-fb-top-bar">
								<p></p>
								<p className="dhp-fb-close" onClick={() => {this.setState({open: false})}}>Luk</p>
							</div>
							<div className="form-group row" ref={ref => {this.emailRef = ref;} }>
								<label className="control-label col-sm-2" htmlFor="feedback-email">Email</label>
								<div className="col-sm-10">
									<input type="email" className="form-control" id="feedback-email" placeholder="Email" value={this.state.email} required={true} onChange={this.handleInputEmail} />
									<div className="invalid-feedback">Ugyldig email</div>
								</div>
							</div>

							<div className="form-group row">
								<label className="control-label col-sm-2" htmlFor="feedback-name">Navn</label>
								<div className="col-sm-10">
									<input type="text" className="form-control" id="feedback-name" placeholder="Navn" value={this.state.name} onChange={this.handleInputName} />
								</div>
							</div>
							
							<div className="form-group row">						
								<label className="control-label col-sm-2" htmlFor="feedback-textarea" >Besked</label>
								<div className="col-sm-10">
									<textarea  className="form-control" id="feedback-textarea" rows="5" value={this.state.message} onChange={this.handleTextInput} />
								</div>
							</div>

							{/* <div className="form-group row">						
								<label className="control-label col-sm-2" htmlFor="feedback-upload" >Fil</label>
								<div className="col-sm-10">
									<input type="text" className="form-control" placeholder="Browse..." />
									<input  className="form-control-file" id="feedback-upload" type="file"  />
								</div>
							</div> */}

							<div className="row">
								<label htmlFor="inputFile" className="col-md-2 control-label">Vedhæft
							
							 <input type="file" id="inputFile" className="dhp-fb-upload" accept=".jpg,.jpeg,.bmp,.png,.pdf" onChange={this.validateUpload} ref={ref => this.fileInputRef = ref} /> &nbsp; &nbsp; <i className="fa fa-upload fa-2x red" aria-hidden="true" ></i> 
								 </label>
								
							</div>

							<button className="dhp-fb-submit" type="submit" onClick={this.submit} style={submitButtonStyle()} disabled={posting()}> <i className="fa fa-comment-alt" aria-hidden="true"></i> {submitButtonText()} </button>
						</form>
				</div>
				
			 	<button className="btn btn-danger dhp-fb-toggle btn-raised"  onClick={this.toggleModal}> <i className="fa fa-comment-alt" aria-hidden="true"></i> &nbsp; Feedback</button>
			</div>
		)
	}
}

module.exports = DHPFeedback;