function provenance = run_provenance(cfg)
%RUN_PROVENANCE Hash inputs and source code, including uncommitted content.
    provenance.created_utc=char(datetime('now','TimeZone','UTC'));
    provenance.matlab_version=version;
    provenance.computer=computer;
    provenance.products=ver;
    provenance.config=cfg;
    provenance.references=struct('data','docs/data_sources.md', ...
        'assumptions','docs/ASSUMPTIONS.md','parameters','config/modsim_config.json');
    [status,revision]=system(sprintf('git -C "%s" rev-parse HEAD',cfg.repoRoot));
    if status~=0, revision='unavailable'; end
    provenance.code_revision=strtrim(revision);
    [status,dirty]=system(sprintf('git -C "%s" status --porcelain',cfg.repoRoot));
    if status~=0, dirty='unavailable'; end
    provenance.dirty_state=dirty;
    files=[dir(fullfile(cfg.repoRoot,'data','processed','*')); ...
        dir(fullfile(cfg.repoRoot,'src','*.m')); dir(fullfile(cfg.repoRoot,'*.m')); ...
        dir(fullfile(cfg.repoRoot,'config','*.json'))];
    entries=struct('path',{},'sha256',{});
    for k=1:numel(files)
        if files(k).isdir, continue; end
        filename=fullfile(files(k).folder,files(k).name);
        fid=fopen(filename,'rb'); assert(fid>=0); c=onCleanup(@() fclose(fid));
        bytes=fread(fid,Inf,'*uint8'); clear c;
        md=java.security.MessageDigest.getInstance('SHA-256');
        md.update(typecast(bytes,'int8'));
        hash=lower(reshape(dec2hex(typecast(md.digest(),'uint8'),2)',1,[]));
        entries(end+1)=struct('path',strrep(filename,[cfg.repoRoot filesep],''),'sha256',hash); %#ok<AGROW>
    end
    provenance.fingerprints=entries;
end
