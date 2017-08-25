let nm
			const cls = {inp:{},dt:{},mo:{}}
			const form = formidable.IncomingForm()
			form.encoding = "utf-8"
			form.keepExtensions = true
			form.uploadDir = root + "/data/scores"
			form.parse(req,(err,fields,value)=>{
				if(err) throw err
				cls.inp = fields;
			})
			form.on('file',(name,file)=>{
				nm = path.basename(file.path)
			})
			form.on('error',(err)=>{console.log(err)})
			form.on('end',()=>{
				ep(root + "/data/scores/" + nm,function(err,data){
					if(err) console.error(err);
					const flds = data.shift()
					class Std {
						constructor(keys,values) {
							keys.forEach((x,i)=>{
								this[x] = values[i];
							})
						}
					}
					let dtob
					cls.inp.testdate = cls.inp.testDate + '/' + cls.inp.testMonth + '/' + cls.inp.testYear
					delete cls.inp.testYear
					delete cls.inp.testMonth
					delete cls.inp.testDate
					mongo.connect('mongodb://localhost:27018/data',(err,db)=>{
						if(err) console.log(err)
						data.forEach((a)=>{
							const o = new Std(flds,a)
							cls.dt[o.enroll_number] = o;
							o.type = "upload"
							dtob = {['student_data.$.' + cls.inp['subject'] + '.exams.' + cls.inp.name] : o}
							db.collection('classes').update({_id:req.params.sch + "/" + req.params.btc + "/" + req.params.sc,"student_data.enroll_number":o.enroll_number},{$set:dtob})
							console.log(dtob);
						})
						db.collection('classes').update({_id:req.params.sch + "/" + req.params.btc + "/" + req.params.sc},{$set:{['exams.' + cls.inp.subject + '.' + cls.inp.name]:{'testdate':cls.inp.testdate,maxscore:cls.inp.maxscore}}})
						db.collection('classes').findOne({_id:req.params.sch + "/" + req.params.btc + "/" + req.params.sc},{'students':1},function(err,item){
							item.students.forEach((s,n)=>{
								cls.mo[s.enroll_number]=[s.parent1,s.parent2]
							})
							console.log(cls);
							serverRequest.call({
		            url:'http://oniv.in/api/sendsms/scores/upload',
		            body: cls,
		            json:true,
		            method:'POST'
		          },res)
						})
					})
				})
			})
